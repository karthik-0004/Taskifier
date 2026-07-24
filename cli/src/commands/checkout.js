import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';

export async function checkOutCmd() {
  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `taskifier login` to get started.\n'));
    return;
  }

  try {
    const res = await ApiClient.checkOut();
    console.log(chalk.green(`\n✔ Checked out successfully at ${new Date(res.checkOutAt).toLocaleTimeString()}. Have a great day!\n`));
  } catch (error) {
    console.log(chalk.red(`\n✘ Check-out failed: ${error.message}\n`));
  }
}
