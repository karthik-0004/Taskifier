import { loginCmd } from './commands/login.js';
import { statusCmd } from './commands/status.js';
import { checkInCmd } from './commands/checkin.js';
import { checkOutCmd } from './commands/checkout.js';
import { startCmd } from './commands/start.js';
import { logoutCmd } from './commands/logout.js';
import { updateCmd } from './commands/update.js';
import { summaryCmd } from './commands/summary.js';

export function setupCommands(program) {
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
    .command('update')
    .description('Submit a work update using AI and your recent git commits')
    .action(updateCmd);

  program
    .command('summary')
    .description('Generate your AI Daily Summary')
    .action(summaryCmd);
}
