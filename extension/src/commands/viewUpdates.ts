import * as vscode from 'vscode';
import { ApiClient } from '../api/client';
import { log } from '../utils/logger';

export async function viewUpdatesCommand() {
    log('Command taskifier.viewUpdates invoked.');
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Fetching today's updates...",
        cancellable: false
    }, async () => {
        try {
            const updates = await ApiClient.getTodayUpdates();
            
            if (!updates || updates.length === 0) {
                vscode.window.showInformationMessage("No updates found for today.");
                return;
            }

            // Create an Output Channel to display the updates beautifully
            const outputChannel = vscode.window.createOutputChannel("Taskifier: Today's Updates");
            outputChannel.clear();
            
            outputChannel.appendLine("=========================================");
            outputChannel.appendLine(`Taskifier: Today's Updates (${updates.length})`);
            outputChannel.appendLine("=========================================\n");

            updates.forEach((u, index) => {
                const time = new Date(u.createdAt).toLocaleTimeString();
                outputChannel.appendLine(`[${index + 1}] Update submitted at ${time}`);
                
                if (u.manualNote) {
                    outputChannel.appendLine(`📝 Manual Note: ${u.manualNote}`);
                }
                
                if (u.rawCommits && Array.isArray(u.rawCommits) && u.rawCommits.length > 0) {
                    outputChannel.appendLine(`📦 Commits Included:`);
                    u.rawCommits.forEach((commit: any) => {
                        let fileCount = 0;
                        if (commit.filesChanged) {
                            if (Array.isArray(commit.filesChanged)) fileCount = commit.filesChanged.length;
                            else if (typeof commit.filesChanged === 'number') fileCount = commit.filesChanged;
                            else fileCount = 1;
                        }
                        
                        const msg = (commit.message || 'No message').replace(/\n/g, ' ');
                        const hash = commit.hash ? commit.hash.substring(0, 7) : 'Unknown';
                        outputChannel.appendLine(`  - [${hash}] ${msg} (${fileCount} files changed)`);
                    });
                }
                
                outputChannel.appendLine("\n-----------------------------------------\n");
            });

            outputChannel.show(true); // Bring to front
            
        } catch (error: any) {
            log(`Failed to fetch updates: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to fetch updates: ${error.message}`);
        }
    });
}
