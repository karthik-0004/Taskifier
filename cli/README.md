# Taskifier CLI

The official Command Line Interface for Taskifier. 
Code. Track. Deliver.

## Installation

You can install the CLI globally via NPM.

```bash
npm install -g taskifier-cli
```

Once installed, simply run the following command to get started:
```bash
t info
```

## Available Commands

- `t login` - Log into your Taskifier account via the terminal.
- `t status` - View your current Taskifier status (active sessions, attendance).
- `t check-in` - Mark your attendance by checking in for the day.
- `t check-out` - Check out for the day, ending your tracked attendance.
- `t start` - Start a new active work session on a specific project.
- `t switch` - Switch your currently active work session from one project to a different project.
- `t update` - Scan your recent Git commits and use AI to automatically generate and submit a mid-day work update.
- `t view-updates` - Display a list of all the mid-day updates you have submitted today.
- `t submit` - Generate and submit your final AI Daily Summary. *(Tip: Use `-r` to review mid-day updates first).*
- `t ai setup` - Configure your local AI provider settings for generating updates and summaries.
- `t logout` - Log out and completely remove your account credentials from the terminal.

## Uninstallation

To completely and safely remove the Taskifier CLI and all stored credentials from your machine, run our dedicated uninstall command:

```bash
t uninstall
```
*(Do not use `npm uninstall` directly, as it will leave your local configurations behind!)*
