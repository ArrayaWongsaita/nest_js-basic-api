import { AdminDataResetResult } from '../../../application/dto/admin-data-reset.result';
import { DemoUserSeedResult } from '../../../application/dto/demo-user-seed.result';
import { AdminUserListResult } from '../../../application/dto/admin-user-list.result';
import { AdminUserView } from '../../../application/ports/admin-user-management.port';
import { PermissionView, RoleView } from '../../../application/ports/rbac-catalog.port';

export class AdminPresenter {
  static toUserResponse(user: AdminUserView) {
    return {
      userId: user.userId,
      email: user.email,
      isActive: user.isActive,
      isSystem: user.isSystem,
      roles: user.roles.map((role) => ({
        id: role.id,
        name: role.name,
        isSystem: role.isSystem,
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static toUserListResponse(result: AdminUserListResult) {
    return result.items.map((user) => this.toUserResponse(user));
  }

  static toUserListMeta(result: AdminUserListResult) {
    return {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    };
  }

  static toRoleResponse(role: RoleView) {
    return {
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      permissions: role.permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        isSystem: permission.isSystem,
      })),
    };
  }

  static toPermissionResponse(permission: PermissionView) {
    return {
      id: permission.id,
      name: permission.name,
      isSystem: permission.isSystem,
    };
  }

  static toResetResponse(result: AdminDataResetResult) {
    return {
      scope: result.scope,
      targetUserId: result.targetUserId,
      domains: [...result.domains],
      mode: result.mode,
      reason: result.reason,
      domainResults: result.domainResults.map((domainResult) => ({
        domain: domainResult.domain,
        deletedRecords: domainResult.deletedRecords,
        preservedRecords: domainResult.preservedRecords,
      })),
      preservedSystemRecords: result.preservedSystemRecords,
      completedAt: result.completedAt.toISOString(),
    };
  }

  static toDemoUserSeedResponse(result: DemoUserSeedResult) {
    return {
      totalUsers: result.totalUsers,
      firstEmail: result.firstEmail,
      lastEmail: result.lastEmail,
      roleName: result.roleName,
      completedAt: result.completedAt.toISOString(),
    };
  }
}
