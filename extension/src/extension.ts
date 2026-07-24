import * as vscode from 'vscode';
import { initializeLogger, log } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    initializeLogger();
    log('Taskifier extension is now active!');

    const commands = [
        'login',
        'status',
        'start',
        'checkout',
        'update',
        'summary',
        'logout'
    ];

    commands.forEach(cmd => {
        const disposable = vscode.commands.registerCommand(`taskifier.${cmd}`, () => {
            log(`Command taskifier.${cmd} invoked.`);
            vscode.window.showInformationMessage(`Taskifier: ${cmd} — not yet implemented`);
        });
        context.subscriptions.push(disposable);
    });
}

export function deactivate() {
    log('Taskifier extension deactivated.');
}
