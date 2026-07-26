import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initializeLogger, log } from './utils/logger';
import { getApiUrl } from './utils/config';
import { secretStore } from './auth/secretStore';
import { authState } from './auth/authState';
import { statusBarManager } from './statusBar/statusBarManager';
import { loginCommand } from './commands/login';
import { statusCommand } from './commands/status';
import { logoutCommand } from './commands/logout';
import { startCommand } from './commands/start';
import { checkoutCommand } from './commands/checkout';
import { updateCommand } from './commands/update';
import { summaryCommand } from './commands/summary';
import { submitSummaryCommand } from './commands/submitSummary';
import { viewUpdatesCommand } from './commands/viewUpdates';
import { viewPreviousSummaryCommand } from './commands/viewPreviousSummary';
import { updateState } from './state/updateState';
import { beautifyPromptCommand } from './commands/beautifyPrompt';
import { gitCollector } from './git/gitCollector';
import { ApiClient } from './api/client';
import { dashboardManager } from './dashboard/dashboardManager';

export async function activate(context: vscode.ExtensionContext) {
    initializeLogger();
    log('Taskifier extension is now active!');
    log(`Configured API URL: ${getApiUrl()}`);

    // Initialize singleton dependencies
    secretStore.initialize(context);
    statusBarManager.initialize(context);
    updateState.initialize(context);

    // Load initial auth state into memory BEFORE initializing the dashboard
    // so that the dashboard immediately knows we are logged in
    await authState.refreshFromStorage();
    
    // Register Activity Bar Webview Dashboard
    dashboardManager.initialize(context);


    if (authState.isLoggedIn && authState.tokens) {
        const emp = authState.tokens.employee;
        log(`Valid session found on startup. Restored connection for: ${emp.name} (${emp.role})`);
    } else {
        log(`No valid session found on startup. Extension is in logged-out state.`);
    }

    // Initialize status bar
    statusBarManager.initialize(context);
    await statusBarManager.refresh();

    // Watch for CLI changes to the shared auth file
    const authFilePath = path.join(os.homedir(), '.taskifier-auth.json');
    if (fs.existsSync(authFilePath)) {
        fs.watchFile(authFilePath, { interval: 1000 }, async (curr, prev) => {
            if (curr.mtimeMs !== prev.mtimeMs) {
                log('Detected auth state change from CLI. Reloading dashboard...');
                await authState.refreshFromStorage();
                await statusBarManager.refresh();
                dashboardManager.refresh();
            }
        });
    }

    // Register login command specifically
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.login', loginCommand)
    );

    // Register status command specifically
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.status', statusCommand)
    );

    // Register logout command specifically
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.logout', logoutCommand)
    );

    // Register start command specifically
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.start', startCommand)
    );

    // Register checkout command specifically
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.checkout', checkoutCommand)
    );

    // Register update command
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.update', updateCommand)
    );

    // Register summary command
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.summary', summaryCommand)
    );

    // Register submit summary command
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.submitSummary', submitSummaryCommand)
    );

    // Register view updates command
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.viewUpdates', viewUpdatesCommand)
    );

    // Register view previous summary command
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.viewPreviousSummary', viewPreviousSummaryCommand)
    );

    // Register beautify prompt command
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.beautifyPrompt', beautifyPromptCommand)
    );
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('taskifier.apiUrl')) {
                log(`API URL setting changed. New URL: ${getApiUrl()}`);
            }
        })
    );
}

export function deactivate() {
    log('Taskifier extension deactivated.');
}

