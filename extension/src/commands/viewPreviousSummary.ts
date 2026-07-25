import * as vscode from 'vscode';
import { ApiClient } from '../api/client';
import { log, getOutputChannel } from '../utils/logger';

export async function viewPreviousSummaryCommand() {
    log('Command taskifier.viewPreviousSummary invoked.');
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Fetching Today's Summary...",
        cancellable: false
    }, async () => {
        try {
            // Need a way to fetch summaries in extension. ApiClient.getDashboard only has summaryStatus.
            // Let's add getMySummaries to ApiClient in extension.
            const summaries = await ApiClient.getMySummaries();
            const todayStr = new Date().toDateString();
            const todaySummary = summaries.find((s: any) => new Date(s.date).toDateString() === todayStr);

            if (!todaySummary) {
                vscode.window.showInformationMessage("No summary has been generated for today yet.");
                return;
            }

            const channel = getOutputChannel();
            channel.show(true);
            
            channel.appendLine('=========================================');
            channel.appendLine(`Taskifier: Today's Summary (${todaySummary.status})`);
            channel.appendLine('=========================================');
            channel.appendLine('');
            channel.appendLine(todaySummary.aiGeneratedContent || todaySummary.content || 'No content generated.');
            channel.appendLine('');
            channel.appendLine('=========================================');

        } catch (error: any) {
            log(`Failed to fetch previous summary: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to fetch previous summary: ${error.message}`);
        }
    });
}
