import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { ApiClient } from '../api/client';
import { log } from '../utils/logger';
import { statusBarManager } from '../statusBar/statusBarManager';
import { dashboardManager } from '../dashboard/dashboardManager';

export async function checkoutCommand() {
    log('Command taskifier.checkout invoked.');

    if (!authState.isLoggedIn) {
        vscode.window.showInformationMessage("Not connected. Run 'Taskifier: Login' first.");
        return;
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Ending Taskifier session...",
        cancellable: false
    }, async () => {
        try {
            // 1. Check current state
            const status = await ApiClient.getStatus();
            const { activeSession } = status;

            // 2. Prevent checkout if no active session
            if (!activeSession) {
                const { attendance } = status;
                const todayDate = new Date();
                const todayEntry = attendance?.find((a: any) => {
                    if (!a.date) return false;
                    const d = new Date(a.date);
                    return d.getDate() === todayDate.getDate() && 
                           d.getMonth() === todayDate.getMonth() && 
                           d.getFullYear() === todayDate.getFullYear();
                });

                if (todayEntry && todayEntry.checkOutAt) {
                    vscode.window.showInformationMessage("Today's session has already been completed.");
                } else {
                    vscode.window.showInformationMessage("You don't have an active session to end.");
                }
                return;
            }

            const projectName = activeSession.project?.name || activeSession.projectName || 'General Work';
            
            // Calculate working time
            let workingTime = "0m";
            if (activeSession.startedAt) {
                const start = new Date(activeSession.startedAt).getTime();
                const now = Date.now();
                const diffMins = Math.floor((now - start) / 60000);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                workingTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            }

            // 3. End session
            log(`Ending active session (${activeSession.id}) on ${projectName}...`);
            await ApiClient.endSession(activeSession.id);
            log(`Session ended successfully.`);

            // 4. Check out for the day
            try {
                log('Checking out for the day...');
                await ApiClient.checkOut();
                log('Check-out successful.');
            } catch (checkoutError: any) {
                // If it fails because they already checked out or similar, handle gracefully
                log(`Check-out failed (possibly already checked out): ${checkoutError.message}`);
            }

            // 5. Success handling
            await statusBarManager.refresh();
            await dashboardManager.refresh();
            
            const successMsg = `Session ended. Worked ${workingTime} on ${projectName}. Checked out for the day.`;
            log(successMsg);
            vscode.window.showInformationMessage(`Taskifier: ${successMsg}`);
            
        } catch (error: any) {
            log(`Checkout failed: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to checkout: ${error.message}`);
            await statusBarManager.refresh(); 
        }
    });
}
