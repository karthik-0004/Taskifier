import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { select } from '@inquirer/prompts';

export async function startCmd() {
  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `taskifier login` to get started.\n'));
    return;
  }

  try {
    const data = await ApiClient.getDashboard();
    if (data.activeSession) {
      console.log(chalk.yellow(`\nYou already have an active session for: ${data.activeSession.projectName}`));
      console.log(chalk.gray(`Started at: ${new Date(data.activeSession.startedAt).toLocaleTimeString()}\n`));
      return;
    }

    console.log(chalk.gray('\nFetching your assigned projects...'));
    // We need to fetch projects from the backend. 
    // I should add getMyProjects to ApiClient
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
    console.log(chalk.red(`\n✘ Failed to start session: ${error.message}\n`));
  }
}
