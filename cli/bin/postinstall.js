#!/usr/bin/env node

import chalk from 'chalk';
import { authState } from '../src/auth.js';

const clipTop = chalk.bold.white('       ╭───────────╮');
const clipHead = chalk.bold.white('     ╭─┴───────────┴─╮');
const clipEmpty = chalk.bold.white('     │               │');
const clipCode = chalk.bold.white('     │     ') + chalk.blueBright.bold('< / >') + chalk.bold.white('     │');
const clipCheck1 = chalk.bold.white('     │  ') + chalk.greenBright('✔') + chalk.gray('  ──────') + chalk.bold.white('    │');
const clipCheck2 = chalk.bold.white('     │  ') + chalk.greenBright('✔') + chalk.gray('  ──────') + chalk.bold.white('    │');
const clipCheck3 = chalk.bold.white('     │  ') + chalk.gray('○  ──────   ') + chalk.blueBright.bold('⋈');
const clipBot = chalk.bold.white('     ╰───────────────╯');

const title = '\n         ' + chalk.bold.white('task') + chalk.bold.blueBright('ifier');
const subtitle = chalk.gray('    CODE. TRACK. DELIVER.\n');

import fs from 'fs';
import os from 'os';
import notifier from 'node-notifier';

const out = `
${clipTop}
${clipHead}
${clipEmpty}
${clipCode}
${clipEmpty}
${clipCheck1}
${clipCheck2}
${clipCheck3}
${clipBot}
${title}
${subtitle}
${chalk.bold.green('Taskifier CLI installed successfully! 🚀\n')}
${chalk.white('To get started, simply type:') + chalk.cyan.bold('\n  t info \n')}
${chalk.gray('Or run ') + chalk.cyan('t info') + chalk.gray(' to view the full command list and setup your workspace.\n')}
`;

try {
  console.log(out);
} catch (e) {}

const isUpdate = authState.getHasSeenWelcome();
const popupTitle = isUpdate ? 'Taskifier CLI Updated! 🔄' : 'Taskifier CLI Installed! 🚀';
const popupMsg = isUpdate 
  ? 'The package was successfully updated! Type `t info` to see what is new.'
  : 'Installation complete. Open your terminal and type `t info` to get started!';

try {
  notifier.notify({
    title: popupTitle,
    message: popupMsg,
    sound: true,
    wait: false
  });
} catch (e) {}

// Give the OS 1.5 seconds to spawn the notification process before we exit
setTimeout(() => {
  process.exit(0);
}, 1500);
