import * as vscode from 'vscode';

export function getApiUrl(): string {
    const config = vscode.workspace.getConfiguration('taskifier');
    return config.get<string>('apiUrl') || 'http://localhost:3000';
}
