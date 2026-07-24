import * as vscode from 'vscode';
import { initializeLogger, log } from './utils/logger';
import { getApiUrl } from './utils/config';
import { secretStore } from './auth/secretStore';
import { authState } from './auth/authState';
import { statusBarManager } from './statusBar/statusBarManager';
import { loginCommand } from './commands/login';
import { statusCommand } from './commands/status';

export async function activate(context: vscode.ExtensionContext) {
    initializeLogger();
    log('Taskifier extension is now active!');
    log(`Configured API URL: ${getApiUrl()}`);

    // Initialize SecretStorage with the extension context
    secretStore.initialize(context);
    
    // Load initial auth state into memory
    await authState.refreshFromStorage();
    // await secretStore.clearTokens();


    if (authState.isLoggedIn && authState.tokens) {
        const emp = authState.tokens.employee;
        log(`Valid session found on startup. Restored connection for: ${emp.name} (${emp.role})`);
    } else {
        log(`No valid session found on startup. Extension is in logged-out state.`);
    }

    // Initialize status bar
    statusBarManager.initialize(context);
    await statusBarManager.refresh();

    // Register login command specifically
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.login', loginCommand)
    );

    // Register status command specifically
    context.subscriptions.push(
        vscode.commands.registerCommand('taskifier.status', statusCommand)
    );

    const placeholders = [
        'start',
        'checkout',
        'update',
        'summary',
        'logout'
    ];

    placeholders.forEach(cmd => {
        const disposable = vscode.commands.registerCommand(`taskifier.${cmd}`, () => {
            log(`Command taskifier.${cmd} invoked.`);
            vscode.window.showInformationMessage(`Taskifier: ${cmd} — not yet implemented`);
        });
        context.subscriptions.push(disposable);
    });

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

