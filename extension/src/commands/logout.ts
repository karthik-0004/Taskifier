import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { secretStore } from '../auth/secretStore';
import { log } from '../utils/logger';
import { statusBarManager } from '../statusBar/statusBarManager';

export async function logoutCommand() {
    log('Command taskifier.logout invoked.');

    if (!authState.isLoggedIn) {
        vscode.window.showInformationMessage("You're not currently connected.");
        return;
    }

    const selection = await vscode.window.showWarningMessage(
        "Are you sure you want to disconnect from Taskifier?",
        { modal: true },
        "Logout"
    );

    if (selection !== "Logout") {
        return;
    }

    try {
        await secretStore.clearTokens();
        await authState.refreshFromStorage();
        await statusBarManager.refresh();

        log('User successfully logged out.');
        vscode.window.showInformationMessage("Disconnected from Taskifier.");
    } catch (error: any) {
        log(`Logout failed: ${error.message}`);
        vscode.window.showErrorMessage(`Logout failed: ${error.message}`);
    }
}
