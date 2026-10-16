import { Result } from '../../../../shared/application/result';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../../domain/constants/audit-action.constants';
import { AdminDataResetResult } from '../dto/admin-data-reset.result';
import { DemoUserSeedResult } from '../dto/demo-user-seed.result';
import { PermissionView, RoleView } from '../ports/rbac-catalog.port';
import { AdminUserView } from '../ports/admin-user-management.port';
import { AuditedAction, AuditDescriptor } from './audited-action';
import { ResetAdminDataRequest } from '../use-cases/reset-admin-data.use-case';
import { CreateRoleRequest } from '../use-cases/create-role.use-case';
import { UpdateRoleRequest } from '../use-cases/update-role.use-case';
import { UpdatePermissionRequest } from '../use-cases/update-permission.use-case';
import {
  ResetAdminUserPasswordRequest,
  ResetAdminUserPasswordResult,
} from '../use-cases/reset-admin-user-password.use-case';
import { UpdateAdminUserRolesRequest } from '../use-cases/update-admin-user-roles.use-case';
import { DeleteAdminUserRequest } from '../use-cases/delete-admin-user.use-case';
import { RestoreAdminUserRequest } from '../use-cases/restore-admin-user.use-case';
import { UpdateAdminUserStatusRequest } from '../use-cases/update-admin-user-status.use-case';

/**
 * How each audited admin action is described in the audit log. Details are
 * picked field by field; never spread a request in here (it may carry secrets).
 */

export type AuditedUpdateUserStatus = AuditedAction<
  UpdateAdminUserStatusRequest,
  Result<AdminUserView, string>
>;
export type AuditedUpdateUserRoles = AuditedAction<
  UpdateAdminUserRolesRequest,
  Result<AdminUserView, string>
>;
export type AuditedResetUserPassword = AuditedAction<
  ResetAdminUserPasswordRequest,
  Result<ResetAdminUserPasswordResult, string>
>;
export type AuditedDeleteUser = AuditedAction<
  DeleteAdminUserRequest,
  Result<AdminUserView, string>
>;
export type AuditedRestoreUser = AuditedAction<
  RestoreAdminUserRequest,
  Result<AdminUserView, string>
>;
export type AuditedCreateRole = AuditedAction<
  CreateRoleRequest,
  Result<RoleView, string>
>;
export type AuditedUpdateRole = AuditedAction<
  UpdateRoleRequest,
  Result<RoleView, string>
>;
export type AuditedDeleteRole = AuditedAction<string, Result<void, string>>;
export type AuditedCreatePermission = AuditedAction<
  string,
  Result<PermissionView, string>
>;
export type AuditedUpdatePermission = AuditedAction<
  UpdatePermissionRequest,
  Result<PermissionView, string>
>;
export type AuditedDeletePermission = AuditedAction<
  string,
  Result<void, string>
>;
export type AuditedResetAdminData = AuditedAction<
  ResetAdminDataRequest,
  Result<AdminDataResetResult, string>
>;
export type AuditedSeedDemoUsers = AuditedAction<
  void,
  Result<DemoUserSeedResult, string>
>;

export function describeUserStatusChange(
  request: UpdateAdminUserStatusRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.userStatusChanged,
    targetType: AUDIT_TARGET_TYPES.user,
    targetId: request.userId,
    details: { isActive: request.isActive },
  };
}

export function describeUserRolesChange(
  request: UpdateAdminUserRolesRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.userRolesChanged,
    targetType: AUDIT_TARGET_TYPES.user,
    targetId: request.userId,
    details: { roleNames: [...request.roleNames] },
  };
}

/** Never include the generated password (or its hash) here. */
export function describeUserPasswordReset(
  request: ResetAdminUserPasswordRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.userPasswordReset,
    targetType: AUDIT_TARGET_TYPES.user,
    targetId: request.userId,
  };
}

export function describeUserDeletion(
  request: DeleteAdminUserRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.userDeleted,
    targetType: AUDIT_TARGET_TYPES.user,
    targetId: request.userId,
  };
}

export function describeUserRestoration(
  request: RestoreAdminUserRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.userRestored,
    targetType: AUDIT_TARGET_TYPES.user,
    targetId: request.userId,
  };
}

export function describeRoleCreation(
  request: CreateRoleRequest,
  result: Result<RoleView, string>,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.roleCreated,
    targetType: AUDIT_TARGET_TYPES.role,
    targetId: result.ok ? result.value.id : null,
    details: {
      name: request.name,
      permissionNames: [...request.permissionNames],
    },
  };
}

export function describeRoleUpdate(
  request: UpdateRoleRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.roleUpdated,
    targetType: AUDIT_TARGET_TYPES.role,
    targetId: request.roleId,
    details: {
      name: request.name,
      permissionNames: [...request.permissionNames],
    },
  };
}

export function describeRoleDeletion(roleId: string): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.roleDeleted,
    targetType: AUDIT_TARGET_TYPES.role,
    targetId: roleId,
  };
}

export function describePermissionCreation(
  name: string,
  result: Result<PermissionView, string>,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.permissionCreated,
    targetType: AUDIT_TARGET_TYPES.permission,
    targetId: result.ok ? result.value.id : null,
    details: { name },
  };
}

export function describePermissionUpdate(
  request: UpdatePermissionRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.permissionUpdated,
    targetType: AUDIT_TARGET_TYPES.permission,
    targetId: request.permissionId,
    details: { name: request.name },
  };
}

export function describePermissionDeletion(
  permissionId: string,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.permissionDeleted,
    targetType: AUDIT_TARGET_TYPES.permission,
    targetId: permissionId,
  };
}

export function describeDataReset(
  request: ResetAdminDataRequest,
): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.dataReset,
    targetType:
      request.scope === 'user'
        ? AUDIT_TARGET_TYPES.user
        : AUDIT_TARGET_TYPES.system,
    targetId: request.targetUserId,
    details: {
      scope: request.scope,
      domains: [...request.domains],
      mode: request.mode,
      hasReason: Boolean(request.reason?.trim()),
    },
  };
}

export function describeDemoSeed(): AuditDescriptor {
  return {
    action: AUDIT_ACTIONS.demoSeed,
    targetType: AUDIT_TARGET_TYPES.system,
    targetId: null,
  };
}
