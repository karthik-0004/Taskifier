import * as vscode from 'vscode';
import { authState } from '../auth/authState';
import { ApiClient } from '../api/client';
import { gitCollector } from '../git/gitCollector';
import { updateState } from '../state/updateState';
import { log } from '../utils/logger';

export async function updateCommand() {
    log('Running update command...');

    if (!authState.isLoggedIn) {
        vscode.window.showInformationMessage("Not connected. Run 'Taskifier: Login' to get started.");
        return;
    }

    try {
        const status = await ApiClient.getStatus();
        
        if (!status.activeSession || !status.activeSession.startedAt) {
            vscode.window.showInformationMessage("Start a work session first with 'Taskifier: Start Session'.");
            return;
        }

        const sessionId = status.activeSession.id;
        const sessionStartTime = new Date(status.activeSession.startedAt).getTime();
        
        const lastUpdateTime = updateState.getLastUpdateTime(sessionId, sessionStartTime);
        log(`Update: checking commits since ${lastUpdateTime.toISOString()}`);
        
        const commits = await gitCollector.getCommitsSince(lastUpdateTime);
        
        // Show preview of commits
        if (commits.length > 0) {
            const commitDetails = commits.map(c => `• [${c.hash.substring(0,7)}] ${c.message}`).join('\n');
            const previewAction = await vscode.window.showInformationMessage(
                `Found ${commits.length} new commits since last update.`,
                { modal: true, detail: commitDetails },
                "Continue"
            );
            if (previewAction !== "Continue") return;
        } else {
            vscode.window.showInformationMessage("No new commits found since last update.");
        }

        // Ask for manual note
        const wantManualNote = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Add a manual note to your update?'
        });
        
        if (!wantManualNote) return; // User cancelled the quick pick

        let manualNote = '';
        if (wantManualNote === 'Yes') {
            const doc = await vscode.workspace.openTextDocument({ content: '', language: 'markdown' });
            await vscode.window.showTextDocument(doc);
            
            vscode.window.showInformationMessage("Taskifier: Type your note. Save (Ctrl+S) or close the file when you are done.");
            
            await new Promise<void>(resolve => {
                const saveSub = vscode.workspace.onDidSaveTextDocument(d => {
                    if (d === doc) {
                        cleanup();
                    }
                });
                
                const closeSub = vscode.workspace.onDidCloseTextDocument(d => {
                    if (d === doc) {
                        cleanup();
                    }
                });

                const cleanup = () => {
                    saveSub.dispose();
                    closeSub.dispose();
                    resolve();
                };
            });
            
            manualNote = doc.getText().trim();
        }

        if (commits.length === 0 && !manualNote) {
            vscode.window.showInformationMessage("Nothing to update — no commits found and no manual note added.");
            return;
        }

        const rawCommitsPayload = commits.map(c => ({ message: c.message, hash: c.hash }));
        let finalContent = manualNote;
        let aiEnhancedContent: string | undefined = undefined;

        let attempt = 0;
        let useAi = false;
        
        const wantAi = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Enhance this update with AI?'
        });
        
        if (!wantAi) return;
        
        if (wantAi === 'Yes') {
            useAi = true;
        }

        // AI loop
        while (useAi && attempt < 5) {
            attempt++;
            log(`Update: AI enhancement attempt ${attempt}`);
            
            aiEnhancedContent = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Taskifier: Enhancing update...",
                cancellable: false
            }, async () => {
                return await ApiClient.enhanceUpdate(rawCommitsPayload, manualNote || undefined);
            });
            
            const submitChoice = await vscode.window.showInformationMessage(
                "AI Enhanced Update:\n" + aiEnhancedContent,
                { modal: true },
                "Submit this update", "Generate different AI version", "Submit raw version instead", "Cancel"
            );
            
            if (submitChoice === "Cancel" || !submitChoice) {
                return;
            }
            
            if (submitChoice === "Submit this update") {
                finalContent = aiEnhancedContent;
                break;
            }
            
            if (submitChoice === "Submit raw version instead") {
                aiEnhancedContent = undefined; // Do not submit AI version
                
                // Construct raw representation
                let rawContent = manualNote ? manualNote + '\n\n' : '';
                if (commits.length > 0) {
                    rawContent += "Commits:\n" + commits.map(c => `- ${c.message}`).join('\n');
                }
                finalContent = rawContent.trim();
                break;
            }
            
            // Generate different AI version
            if (attempt >= 5) {
                vscode.window.showInformationMessage("Reached the AI regeneration limit. Submitting your current AI version.");
                finalContent = aiEnhancedContent;
                break;
            }
        }
        
        // If not using AI at all
        if (!useAi) {
            let rawContent = manualNote ? manualNote + '\n\n' : '';
            if (commits.length > 0) {
                rawContent += "Commits:\n" + commits.map(c => `- ${c.message}`).join('\n');
            }
            finalContent = rawContent.trim();
            
            const submitRaw = await vscode.window.showInformationMessage(
                "Submit this raw update?",
                { modal: true, detail: finalContent },
                "Submit", "Cancel"
            );
            
            if (submitRaw !== "Submit") {
                return;
            }
        }

        // Submit update
        log('Submitting work update to server...');
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Taskifier: Submitting update...",
            cancellable: false
        }, async () => {
            await ApiClient.submitUpdate(
                sessionId,
                rawCommitsPayload,
                manualNote || undefined,
                aiEnhancedContent,
                finalContent
            );
        });

        // Update state
        await updateState.setLastUpdateTime(sessionId, new Date());
        
        vscode.window.showInformationMessage("Update submitted successfully!");
        log('Update successfully logged.');

    } catch (error: any) {
        log(`Update failed: ${error.message}`);
        vscode.window.showErrorMessage(`Update failed: ${error.message}`);
    }
}
