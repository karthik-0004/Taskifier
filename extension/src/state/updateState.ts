import * as vscode from 'vscode';

class UpdateState {
    private globalState!: vscode.Memento;

    initialize(context: vscode.ExtensionContext) {
        this.globalState = context.globalState;
    }

    private getKey(sessionId: string): string {
        return `taskifier.lastUpdate.${sessionId}`;
    }

    getLastUpdateTime(sessionId: string, sessionStartTime: number): Date {
        const storedTime = this.globalState.get<number>(this.getKey(sessionId));
        if (storedTime) {
            return new Date(storedTime);
        }
        return new Date(sessionStartTime);
    }

    async setLastUpdateTime(sessionId: string, date: Date): Promise<void> {
        await this.globalState.update(this.getKey(sessionId), date.getTime());
    }

    // Utility to clean up old session keys (optional, not strictly required yet)
    async clearLastUpdateTime(sessionId: string): Promise<void> {
        await this.globalState.update(this.getKey(sessionId), undefined);
    }
}

export const updateState = new UpdateState();
