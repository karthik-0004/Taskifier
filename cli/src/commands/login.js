import { input, password, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { saveProfile } from '../utils/local-store.js';
import { setupAICmd } from './ai-setup.js';

export async function loginCmd() {
  console.log(chalk.blue.bold('\nWelcome to Taskifier CLI\n'));

  const tokens = authState.getTokens();
  const currentMode = authState.getMode();
  if (tokens && currentMode === 'organization') {
    console.log(chalk.yellow(`Already logged in as ${tokens.employee.name} in Organization mode. Run 't logout' to switch accounts.`));
    return;
  }
  if (currentMode === 'personal') {
    console.log(chalk.yellow(`Already logged in as Personal user. Run 't logout' to switch accounts.`));
    return;
  }

  try {
    let mode;
    while (true) {
      mode = await select({
        message: 'Who are you using Taskifier as?',
        choices: [
          { name: 'Organization (Coming Soon)', value: 'organization', description: 'Connect to an existing Taskifier Organization via backend' },
          { name: 'Personal', value: 'personal', description: 'Standalone offline AI tracking' }
        ]
      });

      if (mode === 'organization') {
        const isDevMode = String(process.env.TASKIFIER_DEV_MODE).toLowerCase() === 'true' || process.env.NODE_ENV === 'development';
        if (isDevMode) {
          console.log(chalk.blue('\nDevelopment Mode Detected: Bypassing Marketplace Organization Restriction...'));
          break;
        }

        console.log(chalk.yellow('\nOrganization Mode is currently unavailable in the public Marketplace release.'));
        console.log(chalk.gray('This feature is under active development and will be available in a future update.'));
        console.log(chalk.gray('For now, please use Personal Mode.\n'));
        
        const orgAction = await select({
          message: 'What would you like to do?',
          choices: [
            { name: 'Go Back', value: 'back' },
            { name: 'Exit', value: 'exit' }
          ]
        });
        
        if (orgAction === 'back') {
          console.log('\n');
          continue;
        } else {
          return;
        }
      }
      break;
    }

    if (mode === 'organization') {
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
      authState.setMode('organization');

      console.log(chalk.green(`\n✔ Successfully connected as ${res.employee.name} (${res.employee.role}) in Organization mode\n`));
    } else {
      const emailStr = await input({ message: 'Enter your email:' });
      saveProfile(emailStr);
      authState.setMode('personal');
      console.log(chalk.green(`\n✔ Successfully logged in as ${emailStr} in Personal mode\n`));

      const isDevMode = String(process.env.TASKIFIER_DEV_MODE).toLowerCase() === 'true' || process.env.NODE_ENV === 'development';
      if (isDevMode) {
        console.log(chalk.blue('\nDevelopment Mode Detected'));
        console.log(chalk.gray('Using AI configuration from local .env'));
        console.log(chalk.green('✓ AI Ready\n'));
      } else {
        await setupAICmd();
      }
    }
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\nLogin cancelled.\n'));
      return;
    }
    console.log(chalk.red(`\n✘ Login failed: ${error.message}\n`));
  }
}
