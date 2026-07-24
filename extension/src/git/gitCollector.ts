import * as vscode from 'vscode';
import { simpleGit, SimpleGit } from 'simple-git';
import { log } from '../utils/logger';

export interface GitCommitInfo {
    hash: string;
    message: string;
    timestamp: Date;
}

export class GitCollector {
    private git: SimpleGit | null = null;
    private workspacePath: string | null = null;

    constructor() {
        this.init();
    }

    private init() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            log('GitCollector: No workspace folders open. Git tracking disabled.');
            return;
        }

        // Use the first workspace folder
        this.workspacePath = workspaceFolders[0].uri.fsPath;
        log(`GitCollector: Initialized in workspace ${this.workspacePath}`);
        
        try {
            this.git = simpleGit(this.workspacePath);
        } catch (error) {
            log('GitCollector: Failed to initialize simple-git.');
            this.git = null;
        }
    }

    public async getCommitsSince(sinceTimestamp: Date): Promise<GitCommitInfo[]> {
        if (!this.git || !this.workspacePath) {
            log('GitCollector: Git not initialized. Returning empty commits.');
            return [];
        }

        try {
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                log('GitCollector: Workspace is not a git repository.');
                return [];
            }

            // Get current author email
            const emailConfig = await this.git.getConfig('user.email');
            const authorEmail = emailConfig.value;
            
            if (!authorEmail) {
                log('GitCollector: Could not determine git user.email. Returning empty commits.');
                return [];
            }

            // Get current branch
            const status = await this.git.status();
            const currentBranch = status.current;

            if (!currentBranch) {
                log('GitCollector: Not on any branch (detached HEAD or empty repo).');
                return [];
            }

            // Since timestamp formatted for git (ISO string or simple date string)
            const sinceString = sinceTimestamp.toISOString();

            // Log parameters for debugging
            log(`GitCollector: Fetching commits on branch '${currentBranch}' by author '${authorEmail}' since ${sinceString}`);

            // Fetch commits
            const logResult = await this.git.log({
                '--author': authorEmail,
                '--since': sinceString,
                '--no-merges': null,
                [currentBranch]: null
            });

            const commits: GitCommitInfo[] = logResult.all.map(commit => ({
                hash: commit.hash,
                message: commit.message,
                timestamp: new Date(commit.date)
            }));
            
            log(`GitCollector: Found ${commits.length} commits.`);
            return commits;
            
        } catch (error: any) {
            log(`GitCollector: Error collecting commits: ${error.message}`);
            return [];
        }
    }
}

export const gitCollector = new GitCollector();
