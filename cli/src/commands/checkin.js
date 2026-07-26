import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';

export async function checkInCmd() {
  const mode = authState.getMode();
  if (mode === 'personal') {
    console.log(chalk.blue('\nℹ Attendance tracking is not required in Personal mode.\n'));
    return;
  }

  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `t login` to get started.\n'));
    return;
  }

  try {
    const res = await ApiClient.checkIn();
    console.log(chalk.green(`\n✔ Attendance logged successfully at ${new Date(res.checkInAt).toLocaleTimeString()}\n`));
  } catch (error) {
    if (error.message.includes('already have an active session') || error.message.includes('already been completed')) {
      console.log(chalk.blue(`\nℹ ${error.message}\n`));
    } else {
      console.log(chalk.red(`\n✘ Check-in failed: ${error.message}\n`));
    }
  }
}
