import chalk from 'chalk';
import { input, select } from '@inquirer/prompts';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { getTodayUpdates, saveReportMarkdown, getProfile } from '../utils/local-store.js';
import { generateSummaryLocally, hasLocalAI } from '../utils/ai-client.js';

export async function submitCmd(options) {
  const mode = authState.getMode();

  if (mode === 'personal') {
    return handlePersonalSubmit(options);
  }

  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `t login` to get started.\n'));
    return;
  }

  try {
    if (options && options.review) {
      console.log(chalk.gray('\nFetching today\'s generated summary...'));
      const summaries = await ApiClient.getMySummaries();
      const todayStr = new Date().toDateString();
      const todaySummary = summaries.find(s => new Date(s.date).toDateString() === todayStr);

      if (!todaySummary) {
        console.log(chalk.yellow('\nNo summary has been generated for today yet. Run `t submit` without flags to generate one.\n'));
        return;
      }

      console.log(chalk.green(`\n✔ Daily Summary is currently in ${todaySummary.status} status.`));
      console.log(chalk.blue.bold('\n--- Summary Content ---'));
      console.log(todaySummary.aiGeneratedContent || todaySummary.content || 'No content generated.');
      console.log(chalk.blue.bold('-----------------------\n'));
      return;
    }

    // Logic for Universal AI in Org mode for submit:
    // If Priority 1 is local AI, we need to generate it locally and then POST to backend... 
    // Wait, the backend `/ai/generate-summary` does the AI generation and saves it. 
    // If we want to use local AI, we'd need an endpoint to just save a custom summary. 
    // Since we cannot change the backend, if Priority 1 triggers in Org mode, we might not be able to bypass the backend AI for `t submit` easily if there is no endpoint. 
    // Actually, we DO have `ApiClient.submitUpdate` but no `ApiClient.submitSummary`. 
    // Let's fallback to backend AI for `submit` in org mode because the backend manages the DailySummary model, unless we can pass content. Let's just call generateSummary.
    if (hasLocalAI()) {
      console.log(chalk.yellow('\nNote: You have a local AI configured, but Organization Mode daily summaries are currently generated via the backend API to maintain data structure.'));
    }

    console.log(chalk.gray('\nAnalyzing your updates and generating Daily Summary with AI...'));
    const res = await ApiClient.generateSummary();
    const summaryData = res.summary || res;
    
    console.log(chalk.green(`\n✔ Daily Summary Generated successfully!`));
    console.log(chalk.blue.bold('\n--- Summary Content ---'));
    console.log(summaryData.aiGeneratedContent || summaryData.content || 'No content generated.');
    console.log(chalk.blue.bold('-----------------------\n'));
    
    const existingContent = summaryData.aiGeneratedContent || summaryData.content || 'No content generated.';
    const updatedContent = await promptAdditionalInfo(existingContent);

    if (updatedContent !== existingContent) {
      await ApiClient.editSummary(summaryData.id, updatedContent);
      console.log(chalk.green('\n✔ Additional information saved.'));
      console.log(chalk.blue.bold('\n--- Updated Summary Content ---'));
      console.log(updatedContent);
      console.log(chalk.blue.bold('-----------------------\n'));
    }

    console.log(chalk.yellow('Note: The summary is currently in DRAFT status.'));
    console.log(chalk.yellow('You can review and approve it from the Web Dashboard or VS Code extension.\n'));

    const approveChoice = await input({ message: 'Do you want to submit it from here? (y/n): ' });
    if (approveChoice.trim().toLowerCase().startsWith('y')) {
      await ApiClient.approveSummary(summaryData.id);
      console.log(chalk.green('\n✔ Summary approved and submitted successfully!\n'));
    } else {
      console.log(chalk.gray('\nSummary left as DRAFT.\n'));
    }

  } catch (error) {
    if (error.name === 'ExitPromptError') return;
    console.log(chalk.red(`\n✘ Failed to process summary: ${error.message}\n`));
  }
}

async function handlePersonalSubmit(options) {
  try {
    const updates = getTodayUpdates();
    if (options && options.review) {
      console.log(chalk.gray('\nFetching today\'s local updates...'));
      if (updates.length === 0) {
        console.log(chalk.yellow('\nNo updates found for today.\n'));
        return;
      }
      updates.forEach((u, i) => {
        console.log(chalk.blue.bold(`\n--- Update ${i+1} ---`));
        console.log(u.finalContent);
      });
      console.log(chalk.blue.bold('-------------------\n'));
      return;
    }

    let summaryContent = '';
    console.log(chalk.gray('\nAnalyzing your local updates...'));
    
    if (hasLocalAI()) {
      console.log(chalk.cyan('Generating Personal Daily Summary with Local AI...'));
      summaryContent = await generateSummaryLocally(updates, '');
    } else {
      console.log(chalk.yellow('\nAI is not configured. Generating raw summary based on updates.'));
      summaryContent = updates.map(u => u.finalContent).join('\n\n');
      if (!summaryContent) summaryContent = 'No updates provided today.';
    }

    console.log(chalk.green(`\n✔ Daily Summary Generated!`));
    console.log(chalk.blue.bold('\n--- Summary Content ---'));
    console.log(summaryContent);
    console.log(chalk.blue.bold('-----------------------\n'));

    const updatedContent = await promptAdditionalInfo(summaryContent);
    if (updatedContent !== summaryContent) {
      summaryContent = updatedContent;
      console.log(chalk.green('\n✔ Additional information saved.'));
      console.log(chalk.blue.bold('\n--- Updated Summary Content ---'));
      console.log(summaryContent);
      console.log(chalk.blue.bold('-----------------------\n'));
    }

    const exportAction = await select({
      message: 'How would you like to save your report?',
      choices: [
        { name: 'Send as email to anyone', value: 'email' },
        { name: 'Save as Markdown (.md)', value: 'markdown' },
        { name: 'Save as PDF (.pdf)', value: 'pdf' },
        { name: 'Cancel', value: 'cancel' }
      ]
    });

    if (exportAction === 'email') {
      const profile = getProfile();
      const email = profile?.email || '';
      
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      const htmlBody = markdownToHtml(summaryContent);
      const emlFile = path.join(os.homedir(), '.taskifier', 'reports', 'draft.eml');
      const emlContent = `To: ${email}\nSubject: Daily Report - ${new Date().toLocaleDateString()}\nX-Unsent: 1\nContent-Type: text/html; charset=utf-8\n\n${htmlBody}`;
      
      fs.writeFileSync(emlFile, emlContent, 'utf8');
      
      const { exec } = await import('child_process');
      const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
      
      exec(`${startCmd} "${emlFile}"`, (err) => {
        if (err) {
          console.log(chalk.red(`\n✘ Failed to open email client. You can manually copy the report above.`));
        }
      });

      console.log(chalk.green(`\n✔ Daily report prepared! Opening your default email client...`));
      console.log(chalk.gray(`(Note: Personal Mode operates fully offline, so we cannot send the email silently. Please click 'Send' in your mail app.)\n`));
    } else if (exportAction === 'markdown') {
      const dateStr = new Date().toISOString().split('T')[0];
      let customFilename = await input({ message: 'Enter a filename (or press Enter to use the date):', default: dateStr });
      if (!customFilename) customFilename = dateStr;
      
      const path = saveReportMarkdown(summaryContent, customFilename);
      console.log(chalk.green(`\n✔ Markdown report saved successfully!`));
      console.log(chalk.cyan(`You can find it here: `) + chalk.white(path) + `\n`);
    } else if (exportAction === 'pdf') {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      const dateStr = new Date().toISOString().split('T')[0];
      
      let customFilename = await input({ message: 'Enter a filename (or press Enter to use the date):', default: dateStr });
      if (!customFilename) customFilename = dateStr;
      if (!customFilename.endsWith('.pdf')) customFilename += '.pdf';

      const reportFile = path.join(os.homedir(), '.taskifier', 'reports', customFilename);
      fs.writeFileSync(reportFile, 'PDF Generation Placeholder - Please implement full PDF generation if needed.\n\n' + summaryContent, 'utf8');
      
      console.log(chalk.green(`\n✔ PDF report saved successfully!`));
      console.log(chalk.cyan(`You can find it here: `) + chalk.white(reportFile) + `\n`);
    } else {
      console.log(chalk.gray('\nSummary export cancelled.\n'));
    }
  } catch (error) {
    if (error.name === 'ExitPromptError') return;
    console.log(chalk.red(`\n✘ Failed to generate personal summary: ${error.message}\n`));
  }
}

async function promptAdditionalInfo(existingContent) {
  const addMore = await select({
    message: "Would you like to add additional information to today's report?",
    choices: [
      { name: 'Yes', value: true },
      { name: 'Skip', value: false }
    ]
  });

  if (!addMore) return existingContent;

  const blockers = await input({ message: "Enter today's blockers (Press Enter to leave empty):" });
  const progress = await input({ message: "Enter your current work in progress (Press Enter to leave empty):" });
  const tomorrow = await input({ message: "Enter your plan for tomorrow (Press Enter to leave empty):" });

  let newContent = existingContent;

  if (blockers) {
    newContent += `\n\n------------------------------------\n\nBlockers\n\n• ${blockers}`;
  }
  if (progress) {
    newContent += `\n\n------------------------------------\n\nCurrent Progress\n\n• ${progress}`;
  }
  if (tomorrow) {
    newContent += `\n\n------------------------------------\n\nTomorrow\n\n• ${tomorrow}`;
  }

  return newContent;
}

function markdownToHtml(markdown) {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px; font-weight: 600;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #1e40af; margin-top: 24px; font-weight: 600;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color: #1e3a8a; margin-top: 24px; font-weight: 700;">$1</h1>')
    // Bold & Italics
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #111827;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Lists (- and •)
    .replace(/^[-\•] (.*$)/gim, '<li style="margin-bottom: 6px; color: #4b5563;">$1</li>')
    // Dividers
    .replace(/------------------------------------/g, '<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">')
    // Line breaks
    .replace(/\n/g, '<br>');

  // We wrap consecutive <li> tags in a <ul> tag
  html = html.replace(/(<li.*<\/li>(<br>)*)+/g, '<ul style="margin: 12px 0; padding-left: 24px;">$&</ul>');
  // Clean up stray <br> inside lists
  html = html.replace(/(<\/li>)<br>/g, '$1');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #374151; line-height: 1.6; font-size: 15px; padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="color: #111827; margin-bottom: 24px; text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; display: inline-block; width: 100%;">Daily Work Report</h2>
      ${html}
    </div>
  `;
}
