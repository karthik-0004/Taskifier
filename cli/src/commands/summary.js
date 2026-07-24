import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';

export async function summaryCmd() {
  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `taskifier login` to get started.\n'));
    return;
  }

  try {
    console.log(chalk.gray('\nAnalyzing your updates and generating Daily Summary with AI...'));
    const res = await ApiClient.generateSummary();
    
    console.log(chalk.green(`\n✔ Daily Summary Generated successfully!`));
    console.log(chalk.blue.bold('\n--- Summary Content ---'));
    console.log(res.content || res.summary?.content || 'Summary generated.');
    console.log(chalk.blue.bold('-----------------------\n'));
    
    console.log(chalk.yellow('Note: The summary is currently in DRAFT status.'));
    console.log(chalk.yellow('You can review and approve it from the Web Dashboard or VS Code extension.\n'));
  } catch (error) {
    console.log(chalk.red(`\n✘ Failed to generate summary: ${error.message}\n`));
  }
}
