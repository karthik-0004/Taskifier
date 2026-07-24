import * as vscode from 'vscode';
import * as fs from 'fs';

export class DashboardProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'taskifier.dashboard';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _onRefresh: () => void
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        // Follow VS Code Webview security guidelines precisely
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Fetch data immediately upon resolve so it isn't empty on first open
        this._onRefresh();

        // Receive messages from the webview (if any)
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'executeCommand':
                    if (message.action) {
                        vscode.commands.executeCommand(message.action);
                    }
                    break;
                case 'refreshDashboard':
                    this._onRefresh();
                    break;
            }
        });
    }

    /**
     * Call this method from extension.ts or api client to push new data to the frontend
     */
    public updateWebview(data: any) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'updateDashboard', data });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Read the HTML shell from disk
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'dashboard', 'webview', 'dashboard.html');
        let htmlContent = '';
        
        try {
            htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
        } catch (e) {
            htmlContent = `<html><body>Failed to load HTML: ${e}</body></html>`;
        }

        // Generate and inject a cryptographically random nonce for CSP
        const nonce = this.getNonce();
        htmlContent = htmlContent.replace(/{{nonce}}/g, nonce);

        return htmlContent;
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
