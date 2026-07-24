import { getApiUrl } from '../utils/config';
import { log } from '../utils/logger';
import { authState } from '../auth/authState';
import { secretStore } from '../auth/secretStore';

export class ApiClient {
    private static async refreshAccessToken(): Promise<boolean> {
        if (!authState.tokens?.refreshToken) return false;
        
        try {
            const url = `${getApiUrl()}/auth/refresh`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: authState.tokens.refreshToken })
            });

            if (!response.ok) {
                await secretStore.clearTokens();
                await authState.refreshFromStorage();
                return false;
            }

            const data = await response.json();
            
            await secretStore.storeTokens(
                data.accessToken,
                data.refreshToken || authState.tokens.refreshToken,
                authState.tokens.employeeId,
                authState.tokens.organizationId,
                authState.tokens.employee
            );
            
            await authState.refreshFromStorage();
            return true;
        } catch (e) {
            await secretStore.clearTokens();
            await authState.refreshFromStorage();
            return false;
        }
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
                    throw new Error('Session expired. Please log in again.');
                }
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                // Surface the backend's explicit error message instead of generic failure
                const message = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(message);
            }
            
            return data as T;
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
            // Note: If /sessions/active throws a 404 (no active session), we catch and return null.
            const [me, activeSession, attendance] = await Promise.all([
                this.request<any>('/users/me'),
                this.request<any>('/sessions/active').catch(() => null),
                this.request<any[]>('/attendance/me').catch(() => [])
            ]);
            
            return { me, activeSession, attendance };
        } catch (error: any) {
            log(`Failed to fetch status: ${error.message}`);
            throw error;
        }
    }
}
