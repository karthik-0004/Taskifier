import chalk from 'chalk';
import notifier from 'node-notifier';
import { confirm } from '@inquirer/prompts';
import { spawn } from 'child_process';
import os from 'os';
import { authState } from '../auth.js';

export async function uninstallCmd() {
  const answer = await confirm({
    message: chalk.yellow('Are you sure you want to completely uninstall Taskifier CLI from your computer?'),
    default: false
  });

  if (!answer) {
    console.log(chalk.gray('Uninstall cancelled.'));
    return;
  }

  // Show farewell message
  console.log('\n');
  console.log(chalk.yellow('╭──────────────────────────────────────────────╮'));
  console.log(chalk.yellow('│                                              │'));
  console.log(chalk.yellow('│  ') + chalk.bold.white('Taskifier CLI has been uninstalled. ') + chalk.yellow('😢') + chalk.yellow('      │'));
  console.log(chalk.yellow('│                                              │'));
  console.log(chalk.yellow('│  ') + chalk.gray('Thank you for using Taskifier! We hope ') + chalk.yellow('     │'));
  console.log(chalk.yellow('│  ') + chalk.gray('to see you again soon. ') + chalk.yellow('                      │'));
  console.log(chalk.yellow('│                                              │'));
  console.log(chalk.yellow('╰──────────────────────────────────────────────╯\n'));

  // Show desktop notification
  try {
    notifier.notify({
      title: 'Taskifier CLI Uninstalled 😢',
      message: 'Thank you for using Taskifier! We hope to see you again soon.',
      sound: true,
      wait: false
    });
  } catch (e) {
    // Ignore error
  }

  // Clear credentials
  authState.clearTokens();

  console.log(chalk.gray('Removing package files in the background...'));

  // Spawn a detached process that waits 2 seconds (giving this CLI time to exit and unlock files)
  // then runs the npm uninstall command.
  const cmd = os.platform() === 'win32' ? 'cmd.exe' : 'sh';
  const args = os.platform() === 'win32' 
    ? ['/c', 'timeout /t 2 /nobreak >nul && npm uninstall -g taskifier-cli']
    : ['-c', 'sleep 2 && npm uninstall -g taskifier-cli'];

  const child = spawn(cmd, args, {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  // Give the OS 1.5 seconds to render the notification popup, then exit to release file locks
  setTimeout(() => {
    process.exit(0);
  }, 1500);
}
