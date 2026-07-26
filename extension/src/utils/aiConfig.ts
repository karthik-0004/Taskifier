import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AIConfig {
    provider: string;
    apiKey: string;
    model: string;
}

export function isDevMode(): boolean {
    return process.env.TASKIFIER_DEV_MODE === 'true' || process.env.NODE_ENV === 'development';
}

export function getAIConfig(): AIConfig | null {
    if (isDevMode() && process.env.OPENAI_API_KEY) {
        return {
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o'
        };
    }

    const configPath = path.join(os.homedir(), '.taskifier', 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            return null;
        }
    }
    return null;
}

export function saveAIConfig(config: AIConfig) {
    const taskifierDir = path.join(os.homedir(), '.taskifier');
    if (!fs.existsSync(taskifierDir)) {
        fs.mkdirSync(taskifierDir, { recursive: true });
    }
    const configPath = path.join(taskifierDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

export async function promptAISetup(): Promise<boolean> {
    const provider = await vscode.window.showQuickPick([
        'openrouter', 'openai', 'anthropic', 'gemini', 'ollama'
    ], { title: 'Select AI Provider' });

    if (!provider) return false;

    let apiKey = '';
    if (provider !== 'ollama') {
        const key = await vscode.window.showInputBox({ 
            title: `Enter ${provider} API Key`, 
            password: true 
        });
        if (!key) return false;
        apiKey = key;
    }

    let defaultModel = '';
    if (provider === 'openrouter') defaultModel = 'anthropic/claude-3.5-sonnet';
    if (provider === 'openai') defaultModel = 'gpt-4o';
    if (provider === 'anthropic') defaultModel = 'claude-3-5-sonnet-20240620';
    if (provider === 'gemini') defaultModel = 'gemini-1.5-pro';
    if (provider === 'ollama') defaultModel = 'llama3';

    const model = await vscode.window.showInputBox({ 
        title: `Enter Model Name`, 
        value: defaultModel 
    });
    
    if (!model) return false;

    saveAIConfig({ provider, apiKey, model });
    return true;
}
