import chalk from 'chalk';

export async function commandsCmd() {
  console.log(chalk.bold.blue('\n--- Taskifier CLI Commands ---\n'));

  const cmds = [
    { name: 'login', desc: 'Logs you into your Taskifier account via the terminal.' },
    { name: 'status', desc: 'Displays your current Taskifier status (e.g., whether you are checked in, your active work sessions, etc.).' },
    { name: 'check-in', desc: 'Marks your attendance by checking you in for the day.' },
    { name: 'check-out', desc: 'Checks you out for the day, ending your tracked attendance.' },
    { name: 'start', desc: 'Starts a new active work session on a specific project.' },
    { name: 'switch', desc: 'Switches your currently active work session from one project to a different project.' },
    { name: 'update', desc: 'Scans your recent Git commits and uses AI to automatically generate and submit a mid-day work update.' },
    { name: 'view-updates', desc: 'Displays a list of all the mid-day updates you have submitted today.' },
    { name: 'submit', desc: 'Generates and submits your final AI Daily Summary. (Tip: Use the -r or --review flag to review your previously submitted mid-day updates before generating the summary).' },
    { name: 'commands', desc: 'Displays this list of commands and their descriptions.' },
    { name: 'logout', desc: 'Logs you out and completely removes your account credentials from the terminal environment.' }
  ];

  cmds.forEach(c => {
    console.log(chalk.green.bold(c.name));
    console.log(`  ${chalk.gray(c.desc)}\n`);
  });
}
