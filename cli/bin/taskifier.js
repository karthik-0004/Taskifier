#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { setupCommands } from '../src/index.js';
import { authState } from '../src/auth.js';
import { showWelcomeScreen } from '../src/welcome.js';

async function main() {
  if (!authState.getHasSeenWelcome()) {
    await showWelcomeScreen();
    // Don't exit here, let it continue or just exit after welcome
    process.exit(0);
  }

  // Setup CLI meta-data
  program
    .name('taskifier')
    .description('Terminal CLI for Taskifier')
    .version('1.0.0');

  // Initialize all commands
  setupCommands(program);

  // Parse the arguments
  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

main();
