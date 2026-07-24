import Conf from 'conf';

const config = new Conf({
  projectName: 'taskifier-cli',
  defaults: {
    accessToken: null,
    refreshToken: null,
    employeeId: null,
    organizationId: null,
    employee: null,
    apiUrl: 'http://localhost:3000'
  }
});

export const authState = {
  getTokens() {
    const accessToken = config.get('accessToken');
    if (!accessToken) return null;
    return {
      accessToken,
      refreshToken: config.get('refreshToken'),
      employeeId: config.get('employeeId'),
      organizationId: config.get('organizationId'),
      employee: config.get('employee')
    };
  },
  
  storeTokens(accessToken, refreshToken, employeeId, organizationId, employee) {
    config.set('accessToken', accessToken);
    config.set('refreshToken', refreshToken);
    config.set('employeeId', employeeId);
    config.set('organizationId', organizationId);
    config.set('employee', employee);
  },
  
  clearTokens() {
    config.delete('accessToken');
    config.delete('refreshToken');
    config.delete('employeeId');
    config.delete('organizationId');
    config.delete('employee');
  },
  
  getApiUrl() {
    return config.get('apiUrl');
  },
  
  setApiUrl(url) {
    config.set('apiUrl', url);
  }
};
