import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { getRecentCommits } from '../git.js';

export async function updateCmd() {
  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `taskifier login` to get started.\n'));
    return;
  }

  try {
    const data = await ApiClient.getDashboard();
    if (!data.activeSession) {
      console.log(chalk.yellow('\n✘ You must start a session first. Run `taskifier start`\n'));
      return;
    }

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

    const manualNote = await input({ message: '\nEnter a manual note for your update (optional):' });
    
    console.log(chalk.cyan('\nProcessing update with AI...'));
    
    const enhancedContent = await ApiClient.enhanceUpdate(commits, manualNote || '');
    
    console.log(chalk.blue.bold('\n--- AI Generated Update ---'));
    console.log(enhancedContent);
    console.log(chalk.blue.bold('---------------------------\n'));
    
    const isGood = await confirm({ message: 'Submit this update?' });
    
    if (isGood) {
      await ApiClient.submitUpdate(data.activeSession.id, commits, manualNote, enhancedContent, enhancedContent);
      console.log(chalk.green('\n✔ Update submitted successfully!\n'));
    } else {
      console.log(chalk.yellow('\nUpdate cancelled.\n'));
    }

  } catch (error) {
    console.log(chalk.red(`\n✘ Failed to submit update: ${error.message}\n`));
  }
}
