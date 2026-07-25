import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';

export async function submitCmd(options) {
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

    console.log(chalk.gray('\nAnalyzing your updates and generating Daily Summary with AI...'));
    const res = await ApiClient.generateSummary();
    const summaryData = res.summary || res;
    
    console.log(chalk.green(`\n✔ Daily Summary Generated successfully!`));
    console.log(chalk.blue.bold('\n--- Summary Content ---'));
    console.log(summaryData.aiGeneratedContent || summaryData.content || 'No content generated.');
    console.log(chalk.blue.bold('-----------------------\n'));
    
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
    console.log(chalk.red(`\n✘ Failed to process summary: ${error.message}\n`));
  }
}
