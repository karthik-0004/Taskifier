#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { setupCommands } from '../src/index.js';
import { authState } from '../src/auth.js';
import { showWelcomeScreen } from '../src/welcome.js';

import updateNotifier from 'update-notifier';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check for updates and notify
updateNotifier({ pkg }).notify();

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
    .version(pkg.version);

  // Initialize all commands
  setupCommands(program);

  // Parse the arguments
  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

main();
