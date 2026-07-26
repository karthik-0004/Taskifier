import { getAIConfig, isDevMode } from './aiConfig';
import * as vscode from 'vscode';
// In the VS Code extension environment, we can use standard fetch API provided by node / vscode, 
// or since we are bundling, we can just dynamically import https/http. We will use the built-in fetch if available,
// or fallback to node's https. In modern Node (v18+) fetch is available. VS Code ships with a modern Node version.

export async function enhancePrompt(promptText: string): Promise<string> {
    const config = getAIConfig();
    if (!config) {
        throw new Error("No AI Configuration found");
    }

    const { provider, apiKey, model } = config;
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    
    if (provider === 'openrouter') {
        baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    } else if (provider === 'ollama') {
        baseUrl = 'http://localhost:11434/api/chat';
    } else if (provider === 'anthropic') {
        baseUrl = 'https://api.anthropic.com/v1/messages';
    } else if (provider === 'gemini') {
        baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    }

    const systemPrompt = "Improve the user's prompt to make it clearer, more detailed, well-structured, and easier for an AI assistant to understand. Preserve the original intent. Do not answer the prompt. Only rewrite it into a higher-quality version. The returned response should contain only the improved prompt. No explanations. No markdown. No code fences.";

    let payload: any = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptText }
        ]
    };

    if (provider === 'gemini') {
        payload = {
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Prompt: ${promptText}` }] }]
        };
    }

    try {
        const headers: any = {
            'Content-Type': 'application/json'
        };
        
        if (provider !== 'ollama' && provider !== 'gemini') {
            if (provider === 'anthropic') {
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
                payload = {
                    model: model,
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: promptText }]
                };
            } else {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
        }

        const res = await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const data: any = await res.json();
        
        if (provider === 'ollama') return data.message.content.trim();
        if (provider === 'anthropic') return data.content[0].text.trim();
        if (provider === 'gemini') return data.candidates[0].content.parts[0].text.trim();
        return data.choices[0].message.content.trim();

    } catch (error: any) {
        throw new Error(`AI Generation failed: ${error.message}`);
    }
}
