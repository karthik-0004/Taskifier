import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { authState } from './auth.js';
import { getProfile } from './utils/local-store.js';
import notifier from 'node-notifier';
import readline from 'readline';

const waitForEsc = () => {
  return new Promise((resolve) => {
    console.log(chalk.gray('\nPress ESC to return to the terminal...'));
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    const handler = (ch, key) => {
      if (key && (key.name === 'escape' || (key.ctrl && key.name === 'c'))) {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        process.stdin.removeListener('keypress', handler);
        process.stdin.pause();
        console.log('');
        resolve();
      }
    };
    process.stdin.on('keypress', handler);
    process.stdin.resume();
  });
};

const showWelcomeScreen = async () => {
  console.log('\n');
  const clipTop    = chalk.bold.white('       ╭───────────╮');
  const clipHead   = chalk.bold.white('     ╭─┴───────────┴─╮');
  const clipEmpty  = chalk.bold.white('     │               │');
  const clipCode   = chalk.bold.white('     │     ') + chalk.blueBright.bold('< / >') + chalk.bold.white('     │');
  const clipCheck1 = chalk.bold.white('     │  ') + chalk.greenBright('✔') + chalk.gray('  ──────') + chalk.bold.white('    │');
  const clipCheck2 = chalk.bold.white('     │  ') + chalk.greenBright('✔') + chalk.gray('  ──────') + chalk.bold.white('    │');
  const clipCheck3 = chalk.bold.white('     │  ') + chalk.gray('○  ──────   ') + chalk.blueBright.bold('⋈');
  const clipBot    = chalk.bold.white('     ╰───────────────╯');

  const title = '\n         ' + chalk.bold.white('task') + chalk.bold.blueBright('ifier');
  const subtitle = chalk.gray('    CODE. TRACK. DELIVER.\n');

  console.log(clipTop);
  console.log(clipHead);
  console.log(clipEmpty);
  console.log(clipCode);
  console.log(clipEmpty);
  console.log(clipCheck1);
  console.log(clipCheck2);
  console.log(clipCheck3);
  console.log(clipBot);
  console.log(title);
  console.log(subtitle);
  
  console.log(chalk.bold.green('Welcome to Taskifier CLI! 🚀\n'));
  
  console.log(chalk.white('Here are the basic commands to get started:'));
  console.log(chalk.cyan('  t login') + chalk.gray('       - Log in to your account'));
  console.log(chalk.cyan('  t status') + chalk.gray('      - View your current attendance and session status'));
  console.log(chalk.cyan('  t check-in') + chalk.gray('    - Start your work day'));
  console.log(chalk.cyan('  t start') + chalk.gray('       - Start a work session for a specific project'));
  console.log(chalk.cyan('  t update') + chalk.gray('      - Submit an AI-powered work update by analyzing Git commits'));
  console.log(chalk.cyan('  t summary') + chalk.gray('     - Generate and submit an AI-powered end-of-day summary'));
  console.log(chalk.cyan('  t check-out') + chalk.gray('   - End your work day'));
  console.log(chalk.cyan('  t info') + chalk.gray('        - Show this welcome screen again\n'));

  const isOrgLoggedIn = !!authState.getTokens();
  const isPersonalLoggedIn = !!getProfile();
  const isLoggedIn = isOrgLoggedIn || isPersonalLoggedIn;

  if (isLoggedIn) {
    await waitForEsc();
    return;
  }

  const mode = await select({
    message: 'How will you be using Taskifier?',
    choices: [
      {
        name: 'Organization Mode (Connecting to a company workspace)',
        value: 'organization',
      },
      {
        name: 'Personal Mode (Individual use)',
        value: 'personal',
      },
    ],
  });

  authState.setMode(mode);
  authState.setHasSeenWelcome(true);

  console.log(chalk.green(`\nSetup complete! You are using Taskifier in ${chalk.bold(mode)} mode.`));
  console.log(chalk.white('Type `t login` to connect your account.\n'));

  // Trigger OS sliding notification recommending VS Code Extension
  try {
    notifier.notify({
      title: 'Taskifier CLI Installed!',
      message: 'Boost your productivity! Install the Taskifier VS Code Extension to track time directly from your editor.',
      sound: true,
      wait: false
    });
  } catch (e) {
    // Ignore notifier errors (e.g., if unsupported on OS)
  }
};

export { showWelcomeScreen };
