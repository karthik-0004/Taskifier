import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { ApiClient } from '../api/client';
import { log } from '../utils/logger';

class StatusBarManager {
    private statusBarItem!: vscode.StatusBarItem;
    private timer?: NodeJS.Timeout;
    private sessionStartTime?: number;
    private projectName?: string;

    public initialize(context: vscode.ExtensionContext) {
        // Shown in the bottom-left
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        context.subscriptions.push(this.statusBarItem);
        
        // Timer for active session, updates every 60 seconds
        this.timer = setInterval(() => {
            if (this.sessionStartTime && this.projectName) {
                this.updateActiveSessionDisplay();
            }
        }, 60000);
        
        context.subscriptions.push({
            dispose: () => clearInterval(this.timer)
        });
    }

    public async refresh() {
        if (!authState.isLoggedIn) {
            this.statusBarItem.text = `$(circle-slash) Taskifier: Not connected`;
            this.statusBarItem.command = 'taskifier.login';
            this.statusBarItem.tooltip = 'Click to login';
            this.statusBarItem.show();
            this.sessionStartTime = undefined;
            return;
        }

        // We are logged in. Fetch status to know if checked in / active session.
        try {
            const status = await ApiClient.getStatus();
            const { me, activeSession } = status;

            // Check if there is an active session
            if (activeSession && activeSession.startedAt) {
                this.sessionStartTime = new Date(activeSession.startedAt).getTime();
                this.projectName = activeSession.project?.name || activeSession.projectName || "Project";
                this.statusBarItem.command = 'taskifier.status';
                this.updateActiveSessionDisplay();
            } else {
                this.sessionStartTime = undefined;
                this.projectName = undefined;
                this.statusBarItem.text = `$(account) Taskifier: ${me.name || authState.tokens?.employee.name}`;
                this.statusBarItem.command = 'taskifier.status';
                this.statusBarItem.tooltip = 'Click to view status';
            }
            this.statusBarItem.show();
        } catch (e) {
            log('Failed to fetch status for status bar update.');
            this.sessionStartTime = undefined;
            this.statusBarItem.text = `$(account) Taskifier: ${authState.tokens?.employee.name || 'Connected'}`;
            this.statusBarItem.command = 'taskifier.status';
            this.statusBarItem.show();
        }
    }

    private updateActiveSessionDisplay() {
        if (!this.sessionStartTime || !this.projectName) return;
        
        const now = Date.now();
        const diffMins = Math.floor((now - this.sessionStartTime) / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        this.statusBarItem.text = `$(clock) ${this.projectName} · ${timeStr}`;
        this.statusBarItem.tooltip = 'Active session running. Click to view status.';
    }
}

export const statusBarManager = new StatusBarManager();
