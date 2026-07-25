import * as vscode from 'vscode';
import { DashboardProvider } from './dashboardProvider';
import { ApiClient } from '../api/client';
import { authState } from '../auth/authState';
import { gitCollector } from '../git/gitCollector';
import { updateState } from '../state/updateState';
import { log } from '../utils/logger';

class DashboardManager {
    private provider?: DashboardProvider;
    private lastSyncTime?: number;
    public aiStatus: 'Available' | 'Unavailable' = 'Available';

    initialize(context: vscode.ExtensionContext) {
        this.provider = new DashboardProvider(context.extensionUri, () => this.refresh());
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                DashboardProvider.viewType, 
                this.provider,
                { webviewOptions: { retainContextWhenHidden: true } }
            )
        );
        
        // Initial refresh
        this.refresh();

        // Watch for CLI operations via shared auth file
        try {
            const fs = require('fs');
            const os = require('os');
            const path = require('path');
            const authFilePath = path.join(os.homedir(), '.taskifier-auth.json');
            
            if (fs.existsSync(authFilePath)) {
                fs.watchFile(authFilePath, { interval: 1000 }, (curr: any, prev: any) => {
                    if (curr.mtimeMs !== prev.mtimeMs) {
                        log(`Detected CLI operation via shared file. Auto-refreshing dashboard...`);
                        this.refresh();
                    }
                });
            }
        } catch (e) {
            log('Could not setup file watcher for CLI sync: ' + e);
        }
    }

    public async refresh() {
        if (!this.provider) return;

        if (!authState.isLoggedIn) {
            this.provider.updateWebview({ loggedIn: false });
            return;
        }

        try {
            const data = await ApiClient.getDashboard();
            
            let unsyncedCommitsCount = 0;
            if (data.activeSession && data.activeSession.startedAt) {
                const sessionStartTime = new Date(data.activeSession.startedAt).getTime();
                const lastUpdateTime = updateState.getLastUpdateTime(data.activeSession.id, sessionStartTime);
                const commits = await gitCollector.getCommitsSince(lastUpdateTime);
                unsyncedCommitsCount = commits.length;
            }

            this.lastSyncTime = Date.now();

            this.provider.updateWebview({ 
                loggedIn: true, 
                ...data, 
                unsyncedCommitsCount,
                backendStatus: 'Connected',
                aiStatus: this.aiStatus,
                lastSyncTime: this.lastSyncTime
            });
        } catch (error: any) {
            log(`Failed to refresh dashboard: ${error.message}`);
            this.provider.updateWebview({ 
                loggedIn: true, // Keep rendering skeleton 
                backendStatus: 'Unreachable',
                aiStatus: 'Unavailable',
                lastSyncTime: this.lastSyncTime
            });
        }
    }
}

export const dashboardManager = new DashboardManager();
