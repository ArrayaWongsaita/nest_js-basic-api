export const AUDIT_ACTIONS = {
  userStatusChanged: 'user.status_changed',
  userPasswordReset: 'user.password_reset',
  userRolesChanged: 'user.roles_changed',
  roleCreated: 'role.created',
  roleUpdated: 'role.updated',
  roleDeleted: 'role.deleted',
  permissionCreated: 'permission.created',
  permissionUpdated: 'permission.updated',
  permissionDeleted: 'permission.deleted',
  dataReset: 'system.data_reset',
  demoSeed: 'system.demo_seed',
} as const;

export const AUDIT_TARGET_TYPES = {
  user: 'user',
  role: 'role',
  permission: 'permission',
  system: 'system',
} as const;
