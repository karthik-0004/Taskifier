import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { getRecentCommits } from '../git.js';
import { getActiveSession, saveUpdate } from '../utils/local-store.js';
import { hasLocalAI, generateUpdateLocally } from '../utils/ai-client.js';

export async function updateCmd() {
  const mode = authState.getMode();
  let activeSessionId = null;

  if (mode === 'personal') {
    const session = getActiveSession();
    if (!session) {
      console.log(chalk.yellow('\n✘ You must start a session first. Run `t start`\n'));
      return;
    }
  } else {
    const tokens = authState.getTokens();
    if (!tokens) {
      console.log(chalk.red('\n✘ Not connected. Run `t login` to get started.\n'));
      return;
    }
    const data = await ApiClient.getDashboard();
    if (!data.activeSession) {
      console.log(chalk.yellow('\n✘ You must start a session first. Run `t start`\n'));
      return;
    }
    activeSessionId = data.activeSession.id;
  }

  try {
    console.log(chalk.gray('\nScanning for local Git commits...'));
    const commits = await getRecentCommits();
    
    if (commits.length > 0) {
      console.log(chalk.green(`Found ${commits.length} commits today.`));
      commits.forEach(c => {
        console.log(chalk.gray(`- [${c.hash.substring(0, 7)}] ${c.message} (${c.filesChanged} files)`));
      });
    } else {
      console.log(chalk.yellow('No local commits found for today.'));
    }

    let manualNote = '';
    const wantsNote = await input({ message: '\nDo you want to add a manual task? (y/n): ' });
    if (wantsNote.trim().toLowerCase().startsWith('y')) {
      manualNote = await input({ message: 'Enter your manual task: ' });
    }
    
    const wantsAi = await input({ message: 'Do you want AI to format and enhance this update? (y/n): ' });
    const useAiGeneration = wantsAi.trim().toLowerCase().startsWith('y');
    
    let finalContent = '';
    let enhancedContent = '';
    
    const rawCommitList = commits.map(c => `- ${c.message}`).join('\n');
    let rawContent = manualNote ? `${manualNote}\n\nCommits:\n${rawCommitList}` : `Commits:\n${rawCommitList}`;
    if (commits.length === 0) rawContent = manualNote || 'No commits or notes provided.';

    if (useAiGeneration) {
      if (hasLocalAI()) {
        console.log(chalk.cyan('\nProcessing update with Local AI...'));
        enhancedContent = await generateUpdateLocally(rawCommitList, manualNote);
      } else if (mode === 'organization') {
        console.log(chalk.cyan('\nProcessing update with Organization AI...'));
        enhancedContent = await ApiClient.enhanceUpdate(commits, manualNote);
      } else {
        console.log(chalk.yellow('\nAI is not configured. Run `t ai setup` to enable AI-powered work updates.'));
        enhancedContent = rawContent;
      }

      console.log(chalk.blue.bold('\n--- AI Generated Update ---'));
      console.log(enhancedContent);
      console.log(chalk.blue.bold('---------------------------\n'));
      
      const useAiChoice = await input({ message: 'Use this AI generated version? (y/n): ' });
      
      if (useAiChoice.trim().toLowerCase().startsWith('y')) {
        finalContent = enhancedContent;
      } else {
        console.log(chalk.gray('\nFalling back to raw commit messages...'));
        finalContent = rawContent;
        console.log(chalk.blue.bold('\n--- Raw Update ---'));
        console.log(finalContent);
        console.log(chalk.blue.bold('------------------\n'));
      }
    } else {
      finalContent = rawContent;
      console.log(chalk.blue.bold('\n--- Raw Update ---'));
      console.log(finalContent);
      console.log(chalk.blue.bold('------------------\n'));
    }
    
    const submitChoice = await input({ message: 'Submit update now? (y/n): ' });
    
    if (submitChoice.trim().toLowerCase().startsWith('y')) {
      if (mode === 'personal') {
        saveUpdate({
          timestamp: new Date().toISOString(),
          rawCommits: commits,
          manualNote,
          aiEnhancedContent: enhancedContent || null,
          finalContent
        });
      } else {
        await ApiClient.submitUpdate(activeSessionId, commits, manualNote, enhancedContent || null, finalContent);
      }
      console.log(chalk.green('\n✔ Update submitted successfully!\n'));
    } else {
      console.log(chalk.yellow('\nUpdate cancelled.\n'));
    }

  } catch (error) {
    if (error.name === 'ExitPromptError') return;
    console.log(chalk.red(`\n✘ Failed to submit update: ${error.message}\n`));
  }
}
