import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import {
  AdminUserManagementPort,
  AdminUserView,
} from '../ports/admin-user-management.port';
import { RbacCatalogPort } from '../ports/rbac-catalog.port';
import { validateRoleNames } from './create-admin-user.use-case';

import { ADMIN_ROLE_NAME } from '../../domain/constants/role-name.constants';

export interface UpdateAdminUserRolesRequest {
  readonly actorUserId: string;
  readonly userId: string;
  readonly roleNames: readonly string[];
}

export class UpdateAdminUserRolesUseCase implements UseCase<
  UpdateAdminUserRolesRequest,
  Result<AdminUserView, string>
> {
  constructor(
    private readonly adminUserManagement: AdminUserManagementPort,
    private readonly rbacCatalog: RbacCatalogPort,
  ) {}

  async execute(
    request: UpdateAdminUserRolesRequest,
  ): Promise<Result<AdminUserView, string>> {
    const user = await this.adminUserManagement.findById(request.userId);

    if (!user) {
      return Result.failure('User was not found.');
    }

    const roleValidationResult = await validateRoleNames(
      this.rbacCatalog,
      request.roleNames,
    );

    if (!roleValidationResult.ok) {
      return Result.failure(roleValidationResult.error);
    }

    const losesAdminRole =
      user.roles.some((role) => role.name === ADMIN_ROLE_NAME) &&
      !roleValidationResult.value.includes(ADMIN_ROLE_NAME);

    if (losesAdminRole) {
      if (request.actorUserId === request.userId) {
        return Result.failure(
          'Admins cannot remove the admin role from their own account.',
        );
      }

      if (
        user.isActive &&
        (await this.adminUserManagement.countActiveAdmins()) <= 1
      ) {
        return Result.failure(
          'The last active admin cannot lose the admin role.',
        );
      }
    }

    const updatedUser = await this.adminUserManagement.updateUserRoles(
      request.userId,
      roleValidationResult.value,
    );

    if (!updatedUser) {
      return Result.failure('User was not found.');
    }

    await this.adminUserManagement.clearAuthSessionsForUser(request.userId);

    return Result.success(updatedUser);
  }
}
