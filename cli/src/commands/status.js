import chalk from 'chalk';
import { ApiClient } from '../api.js';
import { authState } from '../auth.js';
import { getActiveSession, getTodayUpdates, getProfile } from '../utils/local-store.js';

export async function statusCmd() {
  const mode = authState.getMode();

  if (mode === 'personal') {
    const profile = getProfile();
    console.log(chalk.blue.bold('\n🧑‍💻 Connection Status (Personal Mode)'));
    console.log(`Connected as: ${chalk.green(profile?.email || 'Local User')}`);

    const activeSession = getActiveSession();
    console.log(chalk.blue.bold('\n⏱️ Today\'s Session'));
    if (activeSession) {
      console.log(`\nActive Session Started: ${new Date(activeSession.startedAt).toLocaleTimeString()}`);
    } else {
      console.log(chalk.gray('\nNo active session. Run `t start` to begin work.'));
    }

    const updates = getTodayUpdates();
    console.log(chalk.blue.bold('\n📊 Today\'s Progress'));
    console.log(`Updates Submitted: ${chalk.magenta(updates.length)}`);
    console.log('\n');
    return;
  }

  const tokens = authState.getTokens();
  if (!tokens) {
    console.log(chalk.red('\n✘ Not connected. Run `t login` to get started.\n'));
    return;
  }

  try {
    const data = await ApiClient.getDashboard();
    const attendanceRecords = await ApiClient.getMyAttendance();
    
    // Check if the most recent attendance is from today
    let todayAttendance = null;
    if (attendanceRecords && attendanceRecords.length > 0) {
      const latest = attendanceRecords[0];
      const todayStr = new Date().toDateString();
      const latestStr = new Date(latest.date).toDateString();
      if (todayStr === latestStr) {
        todayAttendance = latest;
      }
    }
    
    console.log(chalk.blue.bold('\n🧑‍💻 Connection Status'));
    console.log(`Connected as: ${chalk.green(data.employee.name)} (${data.employee.email})`);
    
    console.log(chalk.blue.bold('\n⏱️ Today\'s Session'));
    if (!todayAttendance?.checkInAt) {
      console.log(chalk.yellow('Not checked in yet. Run `t check-in`'));
    } else if (todayAttendance?.checkOutAt) {
      console.log(chalk.gray(`Checked in at: ${new Date(todayAttendance.checkInAt).toLocaleTimeString()}`));
      console.log(chalk.gray(`Checked out at: ${new Date(todayAttendance.checkOutAt).toLocaleTimeString()}`));
    } else {
      console.log(`Checked in at: ${chalk.green(new Date(todayAttendance.checkInAt).toLocaleTimeString())}`);
    }

    if (data.activeSession) {
      console.log(`\nActive Project: ${chalk.cyan(data.activeSession.projectName)}`);
      console.log(`Session Started: ${new Date(data.activeSession.startedAt).toLocaleTimeString()}`);
    } else {
      console.log(chalk.gray('\nNo active session. Run `t start` to begin work.'));
    }
    
    console.log(chalk.blue.bold('\n📊 Today\'s Progress'));
    console.log(`Commits Synced: ${chalk.magenta(data.todayStats.totalCommitsSynced)}`);
    console.log(`Updates Submitted: ${chalk.magenta(data.todayStats.updatesSubmittedCount)}`);
    console.log(`Daily Summary: ${data.summaryStatus === 'NONE' ? chalk.gray('Pending (Run `t submit`)') : chalk.green(data.summaryStatus)}`);
    
    console.log('\n');
  } catch (error) {
    console.log(chalk.red(`\n✘ Failed to fetch status: ${error.message}\n`));
  }
}
