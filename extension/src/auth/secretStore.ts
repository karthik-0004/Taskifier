import * as vscode from 'vscode';
import { log } from '../utils/logger';

export interface EmployeeInfo {
    name: string;
    email: string;
    role: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    employeeId: string;
    organizationId: string | null;
    employee: EmployeeInfo;
}

class SecretStore {
    private secretStorage?: vscode.SecretStorage;

    public initialize(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    public async storeTokens(
        accessToken: string,
        refreshToken: string,
        employeeId: string,
        organizationId: string | null,
        employeeInfo: EmployeeInfo
    ): Promise<void> {
        if (!this.secretStorage) { throw new Error('SecretStorage not initialized'); }
        
        await this.secretStorage.store('taskifier.accessToken', accessToken);
        await this.secretStorage.store('taskifier.refreshToken', refreshToken);
        await this.secretStorage.store('taskifier.employeeId', employeeId);
        
        if (organizationId) {
            await this.secretStorage.store('taskifier.organizationId', organizationId);
        } else {
            await this.secretStorage.delete('taskifier.organizationId');
        }
        
        // SecretStorage only stores strings, so we serialize the employee object to JSON
        await this.secretStorage.store('taskifier.employeeInfo', JSON.stringify(employeeInfo));
        
        log('Tokens and employee info securely stored.');
    }

    public async getTokens(): Promise<AuthTokens | null> {
        if (!this.secretStorage) { return null; }

        const accessToken = await this.secretStorage.get('taskifier.accessToken');
        if (!accessToken) { return null; }

        const refreshToken = await this.secretStorage.get('taskifier.refreshToken');
        const employeeId = await this.secretStorage.get('taskifier.employeeId');
        const organizationId = await this.secretStorage.get('taskifier.organizationId');
        const employeeInfoStr = await this.secretStorage.get('taskifier.employeeInfo');
        
        if (!refreshToken || !employeeId || !employeeInfoStr) {
            return null;
        }

        let employee: EmployeeInfo;
        try {
            employee = JSON.parse(employeeInfoStr);
        } catch (e) {
            log('Failed to parse stored employee info JSON.');
            return null;
        }

        return {
            accessToken,
            refreshToken,
            employeeId,
            organizationId: organizationId || null,
            employee
        };
    }

    public async clearTokens(): Promise<void> {
        if (!this.secretStorage) { return; }
        
        await this.secretStorage.delete('taskifier.accessToken');
        await this.secretStorage.delete('taskifier.refreshToken');
        await this.secretStorage.delete('taskifier.employeeId');
        await this.secretStorage.delete('taskifier.organizationId');
        await this.secretStorage.delete('taskifier.employeeInfo');
        
        log('Auth tokens securely cleared.');
    }

    public async isLoggedIn(): Promise<boolean> {
        if (!this.secretStorage) { return false; }
        const accessToken = await this.secretStorage.get('taskifier.accessToken');
        return !!accessToken;
    }
}

export const secretStore = new SecretStore();
