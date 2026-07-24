import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { ApiClient } from '../api/client';
import { log } from '../utils/logger';
import { statusBarManager } from '../statusBar/statusBarManager';

export async function statusCommand() {
    log('Command taskifier.status invoked.');

    if (!authState.isLoggedIn) {
        vscode.window.showInformationMessage("Not connected. Run 'Taskifier: Login' to get started.");
        return;
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Fetching Taskifier status...",
        cancellable: false
    }, async () => {
        try {
            const status = await ApiClient.getStatus();
            const { me, activeSession, attendance } = status;

            const name = me.name;
            const orgId = authState.tokens?.organizationId || "Not yet assigned";
            
            // Extract project name safely
            const project = activeSession ? (activeSession.project?.name || activeSession.projectName || "Unknown Project") : "None";
            
            const today = new Date().toISOString().split('T')[0];
            const todayEntry = attendance.find((a: any) => a.date && a.date.startsWith(today));
            let attendanceStatus = "Not checked in today";
            if (todayEntry) {
                if (todayEntry.checkInAt && !todayEntry.checkOutAt) attendanceStatus = "Checked In";
                else if (todayEntry.checkOutAt) attendanceStatus = "Checked Out";
            }

            let workingTime = "—";
            if (activeSession && activeSession.startedAt) {
                const start = new Date(activeSession.startedAt).getTime();
                const now = Date.now();
                const diffMins = Math.floor((now - start) / 60000);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                workingTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            }

            const items: vscode.QuickPickItem[] = [
                { label: `$(check) Connected`, description: `as ${name}` },
                { label: `$(organization) Organization`, description: orgId },
                { label: `$(briefcase) Project`, description: project },
                { label: `$(calendar) Status`, description: attendanceStatus },
                { label: `$(clock) Working Time`, description: workingTime }
            ];

            const quickPick = vscode.window.createQuickPick();
            quickPick.items = items;
            quickPick.title = "Taskifier Status";
            quickPick.show();
            quickPick.onDidHide(() => quickPick.dispose());

            // Always trigger a refresh of the status bar when status is manually checked
            await statusBarManager.refresh();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to fetch status: ${error.message}`);
            await statusBarManager.refresh(); // Important: if session expired, this will hide the active status bar
        }
    });
}
