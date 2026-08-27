import { loginCmd } from './commands/login.js';
import { statusCmd } from './commands/status.js';
import { checkInCmd } from './commands/checkin.js';
import { checkOutCmd } from './commands/checkout.js';
import { startCmd } from './commands/start.js';
import { logoutCmd } from './commands/logout.js';
import { updateCmd } from './commands/update.js';
import { submitCmd } from './commands/submit.js';
import { switchCmd } from './commands/switch.js';
import { viewUpdatesCmd } from './commands/view-updates.js';
import { commandsCmd } from './commands/commands.js';
import { setupAICmd } from './commands/ai-setup.js';
import { uninstallCmd } from './commands/uninstall.js';
import { showWelcomeScreen } from './welcome.js';

export function setupCommands(program) {
  const aiCmd = program.command('ai').description('AI Configuration');
  aiCmd.command('setup').description('Configure AI for work updates').action(setupAICmd);

  program
    .command('login')
    .description('Login to Taskifier')
    .action(loginCmd);

  program
    .command('status')
    .description('View your current Taskifier status')
    .action(statusCmd);
    
  program
    .command('check-in')
    .description('Check in for the day')
    .action(checkInCmd);
    
  program
    .command('check-out')
    .description('Check out for the day')
    .action(checkOutCmd);

  program
    .command('start')
    .description('Start a work session')
    .action(startCmd);
    
  program
    .command('logout')
    .description('Logout and completely remove your account from the terminal')
    .action(logoutCmd);

  program
    .command('uninstall')
    .description('Safely uninstall the Taskifier CLI from your computer')
    .action(uninstallCmd);

  program
    .command('update')
    .description('Submit a work update using AI and your recent git commits')
    .action(updateCmd);

  program
    .command('submit')
    .description('Generate and submit your AI Daily Summary')
    .option('-r, --review', 'Review your previously submitted mid-day updates')
    .action(submitCmd);
    
  program
    .command('switch')
    .description('Switch your active work session to a different project')
    .action(switchCmd);

  program
    .command('view-updates')
    .description('View today\'s submitted mid-day updates')
    .action(viewUpdatesCmd);

  program
    .command('commands')
    .description('Display a list of all available commands and their descriptions')
    .action(commandsCmd);

  program
    .command('info')
    .description('Show the welcome screen and setup wizard')
    .action(async () => {
      await showWelcomeScreen();
      process.exit(0);
    });
}
