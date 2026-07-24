import { getApiUrl } from '../utils/config';
import { log } from '../utils/logger';

export class ApiClient {
    private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${getApiUrl()}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                }
            });
            
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
}
