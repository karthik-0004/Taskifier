import chalk from 'chalk';
import { authState } from '../auth.js';

export async function logoutCmd() {
  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.yellow('\nYou are already logged out.\n'));
    return;
  }
  
  authState.clearTokens();
  console.log(chalk.green('\n✔ Successfully logged out of Taskifier CLI.'));
  console.log(chalk.gray('Your terminal account has been completely removed.\n'));
}
