#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { setupCommands } from '../src/index.js';

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
