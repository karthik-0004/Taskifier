import * as vscode from 'vscode';
import { DashboardProvider } from './dashboardProvider';
import { ApiClient } from '../api/client';
import { authState } from '../auth/authState';
import { gitCollector } from '../git/gitCollector';
import { updateState } from '../state/updateState';
import { log } from '../utils/logger';
import { getAIConfig } from '../utils/aiConfig';

class DashboardManager {
    private provider?: DashboardProvider;
    private lastSyncTime?: number;

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

        if (!authState.isLoggedIn && authState.mode !== 'personal') {
            this.provider.updateWebview({ loggedIn: false, mode: authState.mode });
            return;
        }

        // If it's personal mode, we don't care about backend data or isLoggedIn
        if (authState.mode === 'personal') {
            this.provider.updateWebview({
                loggedIn: true,
                mode: 'personal',
                backendStatus: 'Unreachable',
                aiConfig: getAIConfig(),
                lastSyncTime: Date.now()
            });
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

            const aiConfig = getAIConfig();
            
            this.provider.updateWebview({ 
                loggedIn: true, 
                mode: authState.mode,
                ...data, 
                unsyncedCommitsCount,
                backendStatus: 'Connected',
                aiConfig: aiConfig,
                lastSyncTime: this.lastSyncTime
            });
        } catch (error: any) {
            log(`Failed to refresh dashboard: ${error.message}`);
            this.provider.updateWebview({ 
                loggedIn: true, // Keep rendering skeleton 
                mode: authState.mode,
                backendStatus: 'Unreachable',
                aiConfig: getAIConfig(),
                lastSyncTime: this.lastSyncTime
            });
        }
    }
}

export const dashboardManager = new DashboardManager();
