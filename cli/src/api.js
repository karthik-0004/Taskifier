import axios from 'axios';
import { authState } from './auth.js';
import chalk from 'chalk';

let isRefreshing = false;

export const ApiClient = {
  async getClient() {
    const tokens = authState.getTokens();
    const apiUrl = authState.getApiUrl();
    
    const client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (tokens && tokens.accessToken) {
      client.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    }

    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return Promise.reject(error);
          }
          
          originalRequest._retry = true;
          isRefreshing = true;
          
          try {
            const currentTokens = authState.getTokens();
            if (!currentTokens?.refreshToken) {
              throw new Error('No refresh token available');
            }
            
            const { data } = await axios.post(`${apiUrl}/auth/refresh`, {
              refreshToken: currentTokens.refreshToken
            });
            
            authState.storeTokens(
              data.accessToken,
              data.refreshToken || currentTokens.refreshToken,
              currentTokens.employeeId,
              currentTokens.organizationId,
              currentTokens.employee
            );
            
            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
            isRefreshing = false;
            return axios(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            authState.clearTokens();
            console.log(chalk.red('\nSession expired. Please log in again using `taskifier login`.\n'));
            process.exit(1);
          }
        }
        
        const message = error.response?.data?.message || error.response?.data?.error || error.message;
        return Promise.reject(new Error(message));
      }
    );
    
    return client;
  },

  async login(email, password, connectionKey) {
    const client = await this.getClient();
    const res = await client.post('/auth/extension-login', { email, password, connectionKey });
    return res.data;
  },

  async getDashboard() {
    const client = await this.getClient();
    const res = await client.get('/dashboard/me');
    return res.data;
  },
  
  async checkIn() {
    const client = await this.getClient();
    const res = await client.post('/attendance/check-in', { source: 'CLI' });
    return res.data;
  },
  
  async checkOut() {
    const client = await this.getClient();
    const res = await client.post('/attendance/check-out', { source: 'CLI' });
    return res.data;
  },

  async getMyProjects() {
    const client = await this.getClient();
    const res = await client.get('/projects/mine');
    return res.data;
  },

  async startSession(projectId) {
    const client = await this.getClient();
    const res = await client.post('/sessions/start', { projectId, source: 'CLI' });
    return res.data;
  },

  async getMyAttendance() {
    const client = await this.getClient();
    const res = await client.get('/attendance/me');
    return res.data;
  },

  async enhanceUpdate(rawCommits, manualNote) {
    const client = await this.getClient();
    const res = await client.post('/ai/enhance-update', { rawCommits, manualNote });
    return res.data;
  },

  async submitUpdate(sessionId, rawCommits, manualNote, aiEnhancedContent, finalContent) {
    const client = await this.getClient();
    const res = await client.post('/updates', {
      sessionId,
      rawCommits,
      manualNote,
      aiEnhancedContent,
      finalContent
    });
    return res.data;
  },

  async generateSummary() {
    const client = await this.getClient();
    const res = await client.post('/summaries/generate');
    return res.data;
  }
};
