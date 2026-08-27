#!/usr/bin/env node

import chalk from 'chalk';
import notifier from 'node-notifier';

console.log('\n');
console.log(chalk.yellow('╭──────────────────────────────────────────────╮'));
console.log(chalk.yellow('│                                              │'));
console.log(chalk.yellow('│  ') + chalk.bold.white('Taskifier CLI has been uninstalled. ') + chalk.yellow('😢') + chalk.yellow('      │'));
console.log(chalk.yellow('│                                              │'));
console.log(chalk.yellow('│  ') + chalk.gray('Thank you for using Taskifier! We hope ') + chalk.yellow('     │'));
console.log(chalk.yellow('│  ') + chalk.gray('to see you again soon. ') + chalk.yellow('                      │'));
console.log(chalk.yellow('│                                              │'));
console.log(chalk.yellow('╰──────────────────────────────────────────────╯\n'));

try {
  notifier.notify({
    title: 'Taskifier CLI Uninstalled 😢',
    message: 'Thank you for using Taskifier! We hope to see you again soon.',
    sound: true,
    wait: false
  });
} catch (e) {}

// Give the OS 1.5 seconds to spawn the notification process before we exit
setTimeout(() => {
  process.exit(0);
}, 1500);
