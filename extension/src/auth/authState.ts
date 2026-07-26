import { secretStore, AuthTokens } from './secretStore';
import { log } from '../utils/logger';

class AuthState {
    private currentTokens: AuthTokens | null = null;
    private currentMode: 'organization' | 'personal' = 'organization';
    private loaded = false;

    public async refreshFromStorage(): Promise<void> {
        this.currentTokens = await secretStore.getTokens();
        this.currentMode = await secretStore.getMode();
        this.loaded = true;
        log(this.currentTokens ? `Auth state loaded from storage (${this.currentMode} mode).` : 'No active auth state found in storage.');
    }

    public get tokens(): AuthTokens | null {
        return this.currentTokens;
    }

    public get mode(): 'organization' | 'personal' {
        return this.currentMode;
    }

    public get isLoggedIn(): boolean {
        return !!this.currentTokens;
    }

    public get isLoaded(): boolean {
        return this.loaded;
    }
    
    public setTokensInMemory(tokens: AuthTokens | null) {
        this.currentTokens = tokens;
    }
}

export const authState = new AuthState();
