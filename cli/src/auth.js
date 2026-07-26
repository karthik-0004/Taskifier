import fs from 'fs';
import os from 'os';
import path from 'path';

const authFilePath = path.join(os.homedir(), '.taskifier-auth.json');

const getSharedConfig = () => {
  try {
    if (fs.existsSync(authFilePath)) {
      return JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
    }
  } catch (e) { }
  return {
    accessToken: null,
    refreshToken: null,
    employeeId: null,
    organizationId: null,
    employee: null,
    apiUrl: 'http://localhost:3000',
    mode: null
  };
};

const saveSharedConfig = (config) => {
  try {
    fs.writeFileSync(authFilePath, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) { }
};

export const authState = {
  getTokens() {
    const config = getSharedConfig();
    const accessToken = config.accessToken;
    if (!accessToken) return null;
    return {
      accessToken,
      refreshToken: config.refreshToken,
      employeeId: config.employeeId,
      organizationId: config.organizationId,
      employee: config.employee
    };
  },
  
  storeTokens(accessToken, refreshToken, employeeId, organizationId, employee) {
    const config = getSharedConfig();
    config.accessToken = accessToken;
    config.refreshToken = refreshToken;
    config.employeeId = employeeId;
    config.organizationId = organizationId;
    config.employee = employee;
    saveSharedConfig(config);
  },
  
  clearTokens() {
    const config = getSharedConfig();
    config.accessToken = null;
    config.refreshToken = null;
    config.employeeId = null;
    config.organizationId = null;
    config.employee = null;
    config.mode = null;
    saveSharedConfig(config);
  },
  
  getApiUrl() {
    const config = getSharedConfig();
    return config.apiUrl || 'http://localhost:3000';
  },
  
  setApiUrl(url) {
    const config = getSharedConfig();
    config.apiUrl = url;
    saveSharedConfig(config);
  },

  touchSync() {
    const config = getSharedConfig();
    config.lastCLIAction = Date.now();
    saveSharedConfig(config);
  },

  getMode() {
    const config = getSharedConfig();
    return config.mode || null;
  },

  setMode(mode) {
    const config = getSharedConfig();
    config.mode = mode;
    saveSharedConfig(config);
  }
};
