import * as vscode from 'vscode';
import { ApiClient } from '../api/client';
import { log } from '../utils/logger';
import { dashboardManager } from '../dashboard/dashboardManager';

export async function submitSummaryCommand() {
    log('Command taskifier.submitSummary invoked.');
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Fetching & Generating Daily Summary...",
        cancellable: false
    }, async () => {
        try {
            const data = await ApiClient.getDashboard();

            if (data.summaryStatus === 'APPROVED') {
                vscode.window.showInformationMessage("Your Daily Summary is already APPROVED.");
                return;
            }

            const res = await ApiClient.generateSummary();
            const summaryData = res.summary || res;

            // Show a multi-step QuickPick/Message to approve
            const content = summaryData.aiGeneratedContent || summaryData.content || "Summary generated.";
            
            const choice = await vscode.window.showInformationMessage(
                "Your summary is in DRAFT status. Do you want to approve and submit it now?",
                { modal: true, detail: content },
                "Yes, Submit Now"
            );

            if (choice === "Yes, Submit Now") {
                await ApiClient.approveSummary(summaryData.id);
                vscode.window.showInformationMessage("Summary approved and submitted successfully!");
                dashboardManager.refresh();
            } else {
                vscode.window.showInformationMessage("Summary left as DRAFT.");
            }
        } catch (error: any) {
            log(`Failed to process summary: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to process summary: ${error.message}`);
        }
    });
}
