import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { secretStore } from '../auth/secretStore';
import { ApiClient } from '../api/client';
import { log } from '../utils/logger';
import { statusBarManager } from '../statusBar/statusBarManager';

export async function loginCommand() {
    log('Command taskifier.login invoked.');

    if (authState.isLoggedIn && authState.tokens) {
        const name = authState.tokens.employee.name;
        vscode.window.showInformationMessage(`Already connected as ${name}. Run 'Taskifier: Logout' first to switch accounts.`);
        return;
    }

    const email = await vscode.window.showInputBox({
        prompt: 'Enter your Taskifier email',
        placeHolder: 'e.g. employee@company.com',
        ignoreFocusOut: true,
        validateInput: (text) => {
            if (!text) { return 'Email is required'; }
            if (!text.includes('@')) { return 'Please enter a valid email address'; }
            return null;
        }
    });

    if (!email) {
        log('Login cancelled during email prompt.');
        return;
    }

    const password = await vscode.window.showInputBox({
        prompt: 'Enter your Taskifier password',
        password: true,
        ignoreFocusOut: true,
        validateInput: (text) => {
            if (!text) { return 'Password is required'; }
            return null;
        }
    });

    if (!password) {
        log('Login cancelled during password prompt.');
        return;
    }

    const connectionKey = await vscode.window.showInputBox({
        prompt: 'Enter your Taskifier Connection Key',
        placeHolder: 'e.g. TKF-ABCD-1234',
        ignoreFocusOut: true,
        validateInput: (text) => {
            if (!text) { return 'Connection Key is required'; }
            if (!/^TKF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(text)) {
                return 'Connection Key must be in the format TKF-XXXX-XXXX';
            }
            return null;
        }
    });

    if (!connectionKey) {
        log('Login cancelled during connection key prompt.');
        return;
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Connecting to Taskifier...",
        cancellable: false
    }, async () => {
        log(`Attempting login for email: ${email}`);
        try {
            const res = await ApiClient.extensionLogin(email, password, connectionKey);
            
            await secretStore.storeTokens(
                res.accessToken,
                res.refreshToken,
                res.employeeId,
                res.organizationId,
                res.employee
            );
            
            await authState.refreshFromStorage(); // Sync memory with storage
            await statusBarManager.refresh();
            
            log(`Login successful for ${email}`);
            vscode.window.showInformationMessage(`Taskifier: Connected as ${res.employee.name} (${res.employee.role})`);
        } catch (error: any) {
            log(`Login failed for ${email}: ${error.message}`);
            vscode.window.showErrorMessage(`${error.message}`);
        }
    });
}
