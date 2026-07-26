import chalk from 'chalk';
import { authState } from '../auth.js';
import { clearActiveSession } from '../utils/local-store.js';

export async function logoutCmd() {
  const mode = authState.getMode();
  
  if (mode === 'personal') {
    clearActiveSession();
    authState.clearTokens();
    console.log(chalk.green('\n✔ Successfully logged out of Taskifier Personal Mode.'));
    console.log(chalk.gray('Your active session has been cleared. Reports and configurations are preserved.\n'));
    return;
  }

  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.yellow('\nYou are already logged out.\n'));
    return;
  }
  
  authState.clearTokens();
  console.log(chalk.green('\n✔ Successfully logged out of Taskifier CLI.'));
  console.log(chalk.gray('Your terminal account has been completely removed.\n'));
}
