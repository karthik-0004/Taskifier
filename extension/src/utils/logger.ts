import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel;

export function initializeLogger() {
    outputChannel = vscode.window.createOutputChannel('Taskifier');
}

export function log(message: string) {
    if (!outputChannel) {
        return;
    }
    const timestamp = new Date().toISOString();
    outputChannel.appendLine(`[${timestamp}] ${message}`);
}
