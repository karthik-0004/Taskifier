import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';

export async function checkInCmd() {
  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `taskifier login` to get started.\n'));
    return;
  }

  try {
    const res = await ApiClient.checkIn();
    console.log(chalk.green(`\n✔ Checked in successfully at ${new Date(res.checkInAt).toLocaleTimeString()}\n`));
  } catch (error) {
    console.log(chalk.red(`\n✘ Check-in failed: ${error.message}\n`));
  }
}
