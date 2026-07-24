import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { ApiClient } from '../api/client';
import { gitCollector } from '../git/gitCollector';
import { updateState } from '../state/updateState';
import { dashboardManager } from '../dashboard/dashboardManager';
import { log } from '../utils/logger';

export async function summaryCommand() {
    log('Running summary command...');

    if (!authState.isLoggedIn) {
        vscode.window.showInformationMessage("Not connected. Run 'Taskifier: Login' to get started.");
        return;
    }

    const confirm = await vscode.window.showInformationMessage(
        "Generate your Daily Summary for today?",
        { modal: true, detail: "This will combine all your mid-day updates into a final report." },
        "Generate", "Cancel"
    );

    if (confirm !== "Generate") {
        return;
    }

    try {
        const status = await ApiClient.getStatus();
        if (status.activeSession && status.activeSession.startedAt) {
            const sessionId = status.activeSession.id;
            const sessionStartTime = new Date(status.activeSession.startedAt).getTime();
            const lastUpdateTime = updateState.getLastUpdateTime(sessionId, sessionStartTime);
            
            const unsubmittedCommits = await gitCollector.getCommitsSince(lastUpdateTime);
            
            if (unsubmittedCommits.length > 0) {
                log(`Found ${unsubmittedCommits.length} unsubmitted commits. Auto-submitting before summary...`);
                vscode.window.showInformationMessage(`Taskifier: Auto-saving ${unsubmittedCommits.length} new commits before generating summary...`);
                
                const rawCommitsPayload = unsubmittedCommits.map(c => ({ message: c.message, hash: c.hash }));
                const rawContent = "Commits:\n" + unsubmittedCommits.map(c => `- ${c.message}`).join('\n');
                
                await ApiClient.submitUpdate(
                    sessionId,
                    rawCommitsPayload,
                    undefined,
                    undefined,
                    rawContent
                );
                
                await updateState.setLastUpdateTime(sessionId, new Date());
                await dashboardManager.refresh();
            }
        }

        log('Requesting daily summary generation...');
        const summaryResponse = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Taskifier: Generating Daily Summary...",
            cancellable: false
        }, async () => {
            return await ApiClient.generateSummary();
        });

        // Open text document with generated content for review/editing
        const doc = await vscode.workspace.openTextDocument({
            content: summaryResponse.aiGeneratedContent,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
        
        vscode.window.showInformationMessage(
            "Taskifier: Review and edit your Daily Summary. Save (Ctrl+S) or close the file when you are ready to proceed."
        );
        
        await new Promise<void>(resolve => {
            const saveSub = vscode.workspace.onDidSaveTextDocument(d => {
                if (d === doc) cleanup();
            });
            const closeSub = vscode.workspace.onDidCloseTextDocument(d => {
                if (d === doc) cleanup();
            });

            const cleanup = () => {
                saveSub.dispose();
                closeSub.dispose();
                resolve();
            };
        });

        const finalContent = doc.getText().trim();
        const hasEdited = finalContent !== summaryResponse.aiGeneratedContent;

        if (hasEdited) {
            log('Summary was edited. Saving changes...');
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Taskifier: Saving changes..."
            }, async () => {
                await ApiClient.editSummary(summaryResponse.id, finalContent);
            });
        }

        const approveChoice = await vscode.window.showInformationMessage(
            "Approve and submit this Daily Summary to your manager?",
            { modal: true },
            "Approve", "Cancel"
        );

        if (approveChoice === "Approve") {
            log('Approving summary...');
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Taskifier: Submitting summary..."
            }, async () => {
                await ApiClient.approveSummary(summaryResponse.id);
            });

            await dashboardManager.refresh();

            vscode.window.showInformationMessage("Daily Summary submitted successfully!");
            log('Daily Summary approved.');
        } else {
            vscode.window.showInformationMessage("Summary saved as draft but not approved.");
            log('Summary left as draft.');
            await dashboardManager.refresh();
        }

    } catch (error: any) {
        log(`Summary generation failed: ${error.message}`);
        vscode.window.showErrorMessage(`Failed to process summary: ${error.message}`);
    }
}
