import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { getTodayUpdates } from '../utils/local-store.js';

export async function viewUpdatesCmd() {
  const mode = authState.getMode();

  if (mode === 'personal') {
    console.log(chalk.gray('\nFetching today\'s local submitted updates...'));
    const updates = getTodayUpdates();
    if (!updates || updates.length === 0) {
      console.log(chalk.yellow('\nNo updates submitted today.\n'));
      return;
    }
    renderUpdates(updates);
    return;
  }

  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `t login` to get started.\n'));
    return;
  }

  try {
    console.log(chalk.gray('\nFetching today\'s submitted mid-day updates...'));
    const updates = await ApiClient.getTodayUpdates();
    if (!updates || updates.length === 0) {
      console.log(chalk.yellow('\nNo updates submitted today.\n'));
      return;
    }
    renderUpdates(updates);
  } catch (error) {
    console.log(chalk.red(`\n✘ Failed to fetch updates: ${error.message}\n`));
  }
}

function renderUpdates(updates) {
  console.log(chalk.blue.bold('\n--- Previous Mid-Day Updates ---'));
  updates.forEach((u, idx) => {
    const time = new Date(u.createdAt || u.timestamp).toLocaleTimeString();
    console.log(chalk.cyan(`\n[${idx + 1}] Submitted at ${time}`));
    if (u.manualNote) console.log(`📝 Note: ${u.manualNote}`);
    if (u.rawCommits && u.rawCommits.length > 0) {
      console.log(`📦 Commits Included:`);
      u.rawCommits.forEach(c => console.log(`  - [${c.hash?.substring(0, 7) || 'Unknown'}] ${c.message}`));
    }
    if (u.finalContent) {
      console.log(chalk.gray(`\n✨ Final Formatted Update:\n${u.finalContent}`));
    }
    console.log('--------------------------------');
  });
  console.log('\n');
}
