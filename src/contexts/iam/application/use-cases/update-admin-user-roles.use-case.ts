import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AdminUserManagementPort, AdminUserView } from '../ports/admin-user-management.port';
import { RbacCatalogPort } from '../ports/rbac-catalog.port';
import { validateRoleNames } from './create-admin-user.use-case';

export interface UpdateAdminUserRolesRequest {
  readonly userId: string;
  readonly roleNames: readonly string[];
}

export class UpdateAdminUserRolesUseCase
  implements
    UseCase<UpdateAdminUserRolesRequest, Result<AdminUserView, string>>
{
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

    const updatedUser = await this.adminUserManagement.updateUserRoles(
      request.userId,
      roleValidationResult.value,
    );

    if (!updatedUser) {
      return Result.failure('User was not found.');
    }

    return Result.success(updatedUser);
  }
}
