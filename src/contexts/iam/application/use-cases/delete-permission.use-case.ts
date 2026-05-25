import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { RbacCatalogPort } from '../ports/rbac-catalog.port';

export class DeletePermissionUseCase
  implements UseCase<string, Result<void, string>>
{
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(permissionId: string): Promise<Result<void, string>> {
    const permission = await this.rbacCatalog.findPermissionById(permissionId);

    if (!permission) {
      return Result.failure('Permission was not found.');
    }

    if (permission.isSystem) {
      return Result.failure('System permissions cannot be deleted.');
    }

    if (await this.rbacCatalog.permissionIsAssignedToRoles(permissionId)) {
      return Result.failure(
        'Permission cannot be deleted while it is assigned to roles.',
      );
    }

    await this.rbacCatalog.deletePermission(permissionId);

    return Result.success(undefined);
  }
}
