import { input, password } from '@inquirer/prompts';
import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';

export async function loginCmd() {
  console.log(chalk.blue.bold('\nWelcome to Taskifier CLI\n'));

  const tokens = authState.getTokens();
  if (tokens) {
    console.log(chalk.yellow(`Already logged in as ${tokens.employee.name}. Run 't logout' to switch accounts.`));
    return;
  }

  try {
    const emailStr = await input({ message: 'Enter your Taskifier email:' });
    const passwordStr = await password({ message: 'Enter your Taskifier password:', mask: '*' });
    const connectionKeyStr = await input({ message: 'Enter your Taskifier Connection Key:' });

    console.log(chalk.gray('\nConnecting to Taskifier...'));

    const res = await ApiClient.login(emailStr, passwordStr, connectionKeyStr);
    
    authState.storeTokens(
      res.accessToken,
      res.refreshToken,
      res.employeeId,
      res.organizationId,
      res.employee
    );

    console.log(chalk.green(`\n✔ Successfully connected as ${res.employee.name} (${res.employee.role})\n`));
  } catch (error) {
    console.log(chalk.red(`\n✘ Login failed: ${error.message}\n`));
  }
}
