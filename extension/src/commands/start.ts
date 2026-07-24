import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { ApiClient } from '../api/client';
import { log } from '../utils/logger';
import { statusBarManager } from '../statusBar/statusBarManager';

export async function startCommand() {
    log('Command taskifier.start invoked.');

    if (!authState.isLoggedIn) {
        vscode.window.showInformationMessage("Not connected. Run 'Taskifier: Login' first.");
        return;
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Starting Taskifier session...",
        cancellable: false
    }, async () => {
        try {
            // 1. Check current state (Active session & Attendance)
            const status = await ApiClient.getStatus();
            const { activeSession, attendance } = status;

            // 2. Prevent starting if already active
            if (activeSession && activeSession.startedAt) {
                const projectName = activeSession.project?.name || activeSession.projectName || 'General Work';
                const timeStr = new Date(activeSession.startedAt).toLocaleTimeString();
                vscode.window.showInformationMessage(`You are already tracking time for a work session on ${projectName} (started at ${timeStr}). Run 'Taskifier: Checkout' to stop the timer.`);
                return;
            }

            // 3. Handle check-in if needed
            const todayDate = new Date();
            const todayEntry = attendance.find((a: any) => {
                if (!a.date) return false;
                const d = new Date(a.date);
                return d.getDate() === todayDate.getDate() && 
                       d.getMonth() === todayDate.getMonth() && 
                       d.getFullYear() === todayDate.getFullYear();
            });

            if (todayEntry && todayEntry.checkOutAt) {
                vscode.window.showWarningMessage("You have already checked out for the day. You cannot start a new session.");
                return;
            }

            if (!todayEntry || !todayEntry.checkInAt) {
                log('User not checked in today. Checking in automatically...');
                await ApiClient.checkIn();
                log('Check-in successful.');
            } else {
                log('User was already checked in (likely via web portal).');
                vscode.window.showInformationMessage("Attendance: You were already checked in for today. Now starting your work session timer...");
            }

            // 4. Fetch user's projects
            const projects = await ApiClient.getMyProjects();
            
            // Build QuickPick items
            const quickPickItems: vscode.QuickPickItem[] = [];
            
            quickPickItems.push({
                label: '$(briefcase) No project (general work)',
                description: 'Start a session without linking to a specific project',
                detail: 'GENERAL_WORK_ID'
            });

            if (projects && projects.length > 0) {
                projects.forEach(p => {
                    quickPickItems.push({
                        label: `$(project) ${p.name}`,
                        description: p.status,
                        detail: p.id
                    });
                });
            } else {
                vscode.window.showInformationMessage("You have no assigned projects. Contact your manager.");
                return;
            }

            // Let user pick a project
            const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
                placeHolder: 'Select a project to start working on',
                ignoreFocusOut: true
            });

            if (!selectedItem) {
                log('User cancelled session start prompt.');
                return; // User aborted
            }

            // 5. Start the work session
            const projectId = selectedItem.detail === 'GENERAL_WORK_ID' ? null : selectedItem.detail;
            const projectName = selectedItem.label.replace('$(project) ', '').replace('$(briefcase) ', '');
            
            log(`Starting session on project: ${projectName}`);
            await ApiClient.startSession(projectId || null);

            // 6. Success handling
            await statusBarManager.refresh();
            
            let successMsg = `Started work session`;
            if (projectId) {
                successMsg += ` on ${projectName}.`;
            } else {
                successMsg += ` (General Work).`;
            }
            
            // Add a note about attendance if we checked them in
            if (!todayEntry || !todayEntry.checkInAt) {
                successMsg = `Attendance checked in! ` + successMsg;
            }
            
            log(successMsg);
            vscode.window.showInformationMessage(`Taskifier: ${successMsg}`);
            
        } catch (error: any) {
            // 7. Error handling
            log(`Start session failed: ${error.message}`);
            vscode.window.showErrorMessage(`Failed to start session: ${error.message}`);
            await statusBarManager.refresh(); 
        }
    });
}
