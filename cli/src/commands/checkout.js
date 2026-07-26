import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';

export async function checkOutCmd() {
  const mode = authState.getMode();
  if (mode === 'personal') {
    const { clearActiveSession } = await import('../utils/local-store.js');
    clearActiveSession();
    console.log(chalk.green('\n✔ Active session ended. Have a great day!\n'));
    return;
  }

  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `t login` to get started.\n'));
    return;
  }

  try {
    const res = await ApiClient.checkOut();
    console.log(chalk.green(`\n✔ Checked out successfully at ${new Date(res.checkOutAt).toLocaleTimeString()}. Have a great day!\n`));
  } catch (error) {
    if (error.message.includes('already been completed')) {
      console.log(chalk.blue(`\nℹ ${error.message}\n`));
    } else {
      console.log(chalk.red(`\n✘ Check-out failed: ${error.message}\n`));
    }
  }
}
