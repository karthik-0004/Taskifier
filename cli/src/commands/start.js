import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { select } from '@inquirer/prompts';

export async function startCmd() {
  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `t login` to get started.\n'));
    return;
  }

  try {
    const data = await ApiClient.getDashboard();
    if (data.activeSession) {
      console.log(chalk.yellow(`\nYou already have an active session for: ${data.activeSession.projectName}`));
      console.log(chalk.gray(`Started at: ${new Date(data.activeSession.startedAt).toLocaleTimeString()}\n`));
      return;
    }

    if (data.lastEndedSession) {
      console.log(chalk.blue(`\nℹ Today's session has already been completed. You can start a new session tomorrow.\n`));
      return;
    }

    if (!data.attendance?.checkedInAt) {
      console.log(chalk.gray('\nLogging attendance...'));
      const checkInRes = await ApiClient.checkIn();
      console.log(chalk.green(`✔ Attendance automatically logged at ${new Date(checkInRes.checkInAt).toLocaleTimeString()}`));
    }

    console.log(chalk.gray('\nFetching your assigned projects...'));
    const projects = await ApiClient.getMyProjects();

    if (!projects || projects.length === 0) {
      console.log(chalk.yellow('\nNo active projects assigned to you.'));
      return;
    }

    const choices = projects.map(p => ({
      name: p.name,
      value: p.id,
      description: p.status
    }));
    choices.push({ name: 'Start without a project', value: null });

    const projectId = await select({
      message: 'Select a project to work on:',
      choices
    });

    const res = await ApiClient.startSession(projectId);
    console.log(chalk.green(`\n✔ Work session started for ${res.project?.name || 'No Project'}\n`));
  } catch (error) {
    if (error.message.includes('already been completed')) {
      console.log(chalk.blue(`\nℹ ${error.message}\n`));
    } else if (error.message.includes('already have an active session')) {
      console.log(chalk.yellow(`\n${error.message}\n`));
    } else {
      console.log(chalk.red(`\n✘ Failed to start session: ${error.message}\n`));
    }
  }
}
