import { getApiUrl } from '../utils/config';
import { log } from '../utils/logger';
import { authState } from '../auth/authState';
import { secretStore } from '../auth/secretStore';
import * as vscode from 'vscode';
import { statusBarManager } from '../statusBar/statusBarManager';

let refreshPromise: Promise<boolean> | null = null;

export class ApiClient {
    private static async refreshAccessToken(): Promise<boolean> {
        const tokens = authState.tokens;
        if (!tokens?.refreshToken) return false;
        
        if (refreshPromise) {
            return refreshPromise;
        }

        refreshPromise = (async () => {
            try {
                const url = `${getApiUrl()}/auth/refresh`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: tokens.refreshToken })
                });

                if (!response.ok) {
                    await secretStore.clearTokens();
                    await authState.refreshFromStorage();
                    return false;
                }

                const text = await response.text();
                const data = text ? JSON.parse(text) : null;
                
                await secretStore.storeTokens(
                    data.accessToken,
                    data.refreshToken || tokens.refreshToken,
                    tokens.employeeId,
                    tokens.organizationId,
                    tokens.employee
                );
                
                await authState.refreshFromStorage();
                return true;
            } catch (e) {
                await secretStore.clearTokens();
                await authState.refreshFromStorage();
                return false;
            } finally {
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    }

    private static async request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
        const url = `${getApiUrl()}${endpoint}`;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };

        if (authState.tokens?.accessToken) {
            headers['Authorization'] = `Bearer ${authState.tokens.accessToken}`;
        }

        try {
            let response = await fetch(url, {
                ...options,
                headers
            });
            
            if (response.status === 401 && !isRetry) {
                log('Token expired. Attempting refresh...');
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${authState.tokens?.accessToken}`;
                    response = await fetch(url, { ...options, headers });
                } else {
                    vscode.window.showInformationMessage("Your Taskifier session expired. Run 'Taskifier: Login' to reconnect.");
                    await statusBarManager.refresh();
                    throw new Error('Session expired. Please log in again.');
                }
            }
            
            if (response.status === 204) return null as unknown as T;
            
            const text = await response.text();
            
            if (!response.ok) {
                let message = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const parsed = text ? JSON.parse(text) : {};
                    message = parsed.message || parsed.error || message;
                } catch (e) {
                    message = text || message;
                }
                throw new Error(message);
            }
            
            return (text ? JSON.parse(text) : null) as T;
        } catch (error: any) {
            log(`API Error [${endpoint}]: ${error.message}`);
            throw error;
        }
    }

    public static async extensionLogin(email: string, password: string, connectionKey: string): Promise<any> {
        return this.request('/auth/extension-login', {
            method: 'POST',
            body: JSON.stringify({ email, password, connectionKey })
        });
    }

    public static async getStatus() {
        try {
            const [me, activeSession, attendance] = await Promise.all([
                this.request<any>('/users/me'),
                this.request<any>('/sessions/active'),
                this.request<any[]>('/attendance/me')
            ]);
            
            return { me, activeSession, attendance: attendance || [] };
        } catch (error: any) {
            log(`Failed to fetch status: ${error.message}`);
            throw error;
        }
    }
}
