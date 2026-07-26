export const PERMISSIONS = [
  'MANAGE_MEMBERS',
  'CREATE_ROLES',
  'INVITE_EMPLOYEES',
  'MANAGE_PROJECTS',
  'VIEW_TEAM_SUMMARIES',
  'VIEW_REPORTS',
  'MANAGE_ATTENDANCE'
] as const;

export type PermissionKey = typeof PERMISSIONS[number];
