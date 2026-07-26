import * as vscode from 'vscode';
import { getAIConfig, promptAISetup } from '../utils/aiConfig';
import { enhancePrompt } from '../utils/aiClient';

export async function beautifyPromptCommand() {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor || editor.selection.isEmpty) {
        vscode.window.showErrorMessage('Please select a prompt before using Taskifier Prompt Beautifier.');
        return;
    }

    const originalSelection = editor.selection;
    const selectedText = editor.document.getText(originalSelection);

    let config = getAIConfig();
    if (!config) {
        const choice = await vscode.window.showInformationMessage(
            "Taskifier Prompt Beautifier requires an AI provider.\n\nYou haven't configured AI yet.\n\nChoose an option:",
            "Configure AI Now", "Continue Without AI", "Cancel"
        );
        
        if (choice === "Configure AI Now") {
            const success = await promptAISetup();
            if (success) {
                const proceed = await vscode.window.showInformationMessage(
                    "✓ AI configured successfully.\n\nWould you like to beautify the selected prompt now?",
                    "Yes", "No"
                );
                if (proceed === "Yes") {
                    config = getAIConfig(); // reload
                } else {
                    return;
                }
            } else {
                return;
            }
        } else {
            return;
        }
    }

    await performBeautification(editor, originalSelection, selectedText);
}

async function performBeautification(originalEditor: vscode.TextEditor, selection: vscode.Selection, originalText: string) {
    let beautifiedText = '';
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Taskifier",
        cancellable: false
    }, async (progress) => {
        progress.report({ message: "Beautifying prompt via AI..." });
        try {
            beautifiedText = await enhancePrompt(originalText);
        } catch (err: any) {
            vscode.window.showErrorMessage(`Unable to contact AI Provider. ${err.message}`);
        }
    });

    if (!beautifiedText) return; // Errored out

    // Create virtual documents for diffing
    const originalUri = vscode.Uri.parse(`untitled:Original Prompt`);
    const beautifiedUri = vscode.Uri.parse(`untitled:Beautified Prompt`);

    // In VS Code, to show content in an 'untitled' diff correctly and easily:
    const originalDoc = await vscode.workspace.openTextDocument(originalUri);
    const beautifiedDoc = await vscode.workspace.openTextDocument(beautifiedUri);

    // We must write the contents to these documents using WorkspaceEdit
    const edit = new vscode.WorkspaceEdit();
    edit.insert(originalUri, new vscode.Position(0, 0), originalText);
    edit.insert(beautifiedUri, new vscode.Position(0, 0), beautifiedText);
    await vscode.workspace.applyEdit(edit);

    await vscode.commands.executeCommand('vscode.diff', originalUri, beautifiedUri, 'Original Prompt ↔ Beautified Prompt');

    // Prompt for action
    showActionMenu(originalEditor, selection, beautifiedUri, originalText);
}

async function showActionMenu(originalEditor: vscode.TextEditor, selection: vscode.Selection, beautifiedUri: vscode.Uri, originalText: string) {
    const action = await vscode.window.showInformationMessage(
        "Review your Beautified Prompt:",
        "Replace Selection", "Copy Beautified Prompt", "Regenerate", "Cancel"
    );

    if (action === "Replace Selection") {
        // Read current text from right side
        const doc = await vscode.workspace.openTextDocument(beautifiedUri);
        const newText = doc.getText();
        
        await originalEditor.edit(editBuilder => {
            editBuilder.replace(selection, newText);
        });
        
        // Close diff editor
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    } 
    else if (action === "Copy Beautified Prompt") {
        const doc = await vscode.workspace.openTextDocument(beautifiedUri);
        await vscode.env.clipboard.writeText(doc.getText());
        vscode.window.showInformationMessage("Copied to clipboard!");
        
        // Loop back so they can still replace or cancel
        showActionMenu(originalEditor, selection, beautifiedUri, originalText);
    } 
    else if (action === "Regenerate") {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Taskifier",
        }, async (progress) => {
            progress.report({ message: "Regenerating..." });
            try {
                const newBeautifiedText = await enhancePrompt(originalText);
                
                // Update the right side document
                const doc = await vscode.workspace.openTextDocument(beautifiedUri);
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    doc.positionAt(0),
                    doc.positionAt(doc.getText().length)
                );
                edit.replace(beautifiedUri, fullRange, newBeautifiedText);
                await vscode.workspace.applyEdit(edit);

            } catch (err: any) {
                vscode.window.showErrorMessage(`Unable to contact AI Provider. ${err.message}`);
            }
        });

        // Loop back
        showActionMenu(originalEditor, selection, beautifiedUri, originalText);
    } 
    else if (action === "Cancel") {
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
}
