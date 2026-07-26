import fs from 'fs';
import path from 'path';
import os from 'os';

const taskifierDir = path.join(os.homedir(), '.taskifier');
const profilePath = path.join(taskifierDir, 'profile.json');
const configPath = path.join(taskifierDir, 'config.json');
const sessionsDir = path.join(taskifierDir, 'sessions');
const updatesDir = path.join(taskifierDir, 'updates');
const reportsDir = path.join(taskifierDir, 'reports');

export const initLocalStore = () => {
  [taskifierDir, sessionsDir, updatesDir, reportsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

export const getProfile = () => {
  initLocalStore();
  if (fs.existsSync(profilePath)) {
    return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  }
  return null;
};

export const saveProfile = (email) => {
  initLocalStore();
  const profile = { email, mode: 'personal', createdAt: new Date().toISOString() };
  fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf8');
  return profile;
};

export const getAIConfig = () => {
  initLocalStore();
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return null;
};

export const saveAIConfig = (config) => {
  initLocalStore();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
};

export const removeAIConfig = () => {
  initLocalStore();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
};

export const getActiveSession = () => {
  const activePath = path.join(sessionsDir, 'active.json');
  if (fs.existsSync(activePath)) {
    return JSON.parse(fs.readFileSync(activePath, 'utf8'));
  }
  return null;
};

export const saveActiveSession = (session) => {
  initLocalStore();
  const activePath = path.join(sessionsDir, 'active.json');
  fs.writeFileSync(activePath, JSON.stringify(session, null, 2), 'utf8');
};

export const clearActiveSession = () => {
  const activePath = path.join(sessionsDir, 'active.json');
  if (fs.existsSync(activePath)) {
    fs.unlinkSync(activePath);
  }
};

export const saveUpdate = (update) => {
  initLocalStore();
  const dateStr = new Date().toISOString().split('T')[0];
  const updateFile = path.join(updatesDir, `${dateStr}.json`);
  let updates = [];
  if (fs.existsSync(updateFile)) {
    updates = JSON.parse(fs.readFileSync(updateFile, 'utf8'));
  }
  updates.push(update);
  fs.writeFileSync(updateFile, JSON.stringify(updates, null, 2), 'utf8');
};

export const getTodayUpdates = () => {
  const dateStr = new Date().toISOString().split('T')[0];
  const updateFile = path.join(updatesDir, `${dateStr}.json`);
  if (fs.existsSync(updateFile)) {
    return JSON.parse(fs.readFileSync(updateFile, 'utf8'));
  }
  return [];
};

export const saveReportMarkdown = (markdown, customFilename = null) => {
  initLocalStore();
  const dateStr = new Date().toISOString().split('T')[0];
  let filename = customFilename || dateStr;
  if (!filename.endsWith('.md')) {
    filename += '.md';
  }
  const reportFile = path.join(reportsDir, filename);
  fs.writeFileSync(reportFile, markdown, 'utf8');
  return reportFile;
};
