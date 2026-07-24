import * as vscode from 'vscode';
import { authState } from '../auth/authState';

let statusBarItem: vscode.StatusBarItem;

export function initializeStatusBar(context: vscode.ExtensionContext) {
    // Create it on the right side of the status bar, lower priority to sit near other text
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'taskifier.status';
    context.subscriptions.push(statusBarItem);
    
    updateStatusBar();
}

export function updateStatusBar() {
    if (authState.isLoggedIn && authState.tokens?.employee) {
        statusBarItem.text = `$(pulse) Taskifier: Connected`;
        statusBarItem.tooltip = `Connected as ${authState.tokens.employee.name}`;
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}
