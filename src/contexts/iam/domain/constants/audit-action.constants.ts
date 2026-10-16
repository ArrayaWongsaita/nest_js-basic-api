export const AUDIT_ACTIONS = {
  userStatusChanged: 'user.status_changed',
  userPasswordReset: 'user.password_reset',
  userRolesChanged: 'user.roles_changed',
  userDeleted: 'user.deleted',
  userRestored: 'user.restored',
  roleCreated: 'role.created',
  roleUpdated: 'role.updated',
  roleDeleted: 'role.deleted',
  permissionCreated: 'permission.created',
  permissionUpdated: 'permission.updated',
  permissionDeleted: 'permission.deleted',
  dataReset: 'system.data_reset',
  demoSeed: 'system.demo_seed',
  todoDeletedByAdmin: 'todo.deleted_by_admin',
} as const;

export const AUDIT_TARGET_TYPES = {
  user: 'user',
  role: 'role',
  permission: 'permission',
  system: 'system',
  todo: 'todo',
} as const;
