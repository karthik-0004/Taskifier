import * as vscode from 'vscode';
import { log } from '../utils/logger';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
    private get authFilePath(): string {
        return path.join(os.homedir(), '.taskifier-auth.json');
    }

    private async getSharedConfig(): Promise<any> {
        try {
            if (fs.existsSync(this.authFilePath)) {
                const data = await fs.promises.readFile(this.authFilePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (e) {
            log('Error reading shared config: ' + e);
        }
        return {};
    }

    private async saveSharedConfig(config: any): Promise<void> {
        try {
            await fs.promises.writeFile(this.authFilePath, JSON.stringify(config, null, 2), 'utf8');
        } catch (e) {
            log('Error saving shared config: ' + e);
        }
    }

    public initialize(context: vscode.ExtensionContext) {
        // No longer using SecretStorage, but keep method for compatibility
    }

    public async storeTokens(
        accessToken: string,
        refreshToken: string,
        employeeId: string,
        organizationId: string | null,
        employeeInfo: EmployeeInfo
    ): Promise<void> {
        const config = await this.getSharedConfig();
        config.accessToken = accessToken;
        config.refreshToken = refreshToken;
        config.employeeId = employeeId;
        config.organizationId = organizationId;
        config.employee = employeeInfo;
        
        await this.saveSharedConfig(config);
        log('Tokens and employee info securely stored in shared file.');
    }

    public async getTokens(): Promise<AuthTokens | null> {
        const config = await this.getSharedConfig();
        const accessToken = config.accessToken;
        if (!accessToken) { return null; }

        const refreshToken = config.refreshToken;
        const employeeId = config.employeeId;
        const organizationId = config.organizationId;
        const employee = config.employee;
        
        if (!refreshToken || !employeeId || !employee) {
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
        const config = await this.getSharedConfig();
        config.accessToken = null;
        config.refreshToken = null;
        config.employeeId = null;
        config.organizationId = null;
        config.employee = null;
        
        await this.saveSharedConfig(config);
        log('Auth tokens securely cleared from shared file.');
    }

    public async isLoggedIn(): Promise<boolean> {
        const config = await this.getSharedConfig();
        return !!config.accessToken;
    }

    public async getMode(): Promise<'organization' | 'personal'> {
        const config = await this.getSharedConfig();
        return config.mode || 'organization';
    }
}

export const secretStore = new SecretStore();
