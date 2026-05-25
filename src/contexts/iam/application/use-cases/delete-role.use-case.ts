import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { RbacCatalogPort } from '../ports/rbac-catalog.port';

export class DeleteRoleUseCase
  implements UseCase<string, Result<void, string>>
{
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(roleId: string): Promise<Result<void, string>> {
    const role = await this.rbacCatalog.findRoleById(roleId);

    if (!role) {
      return Result.failure('Role was not found.');
    }

    if (role.isSystem) {
      return Result.failure('System roles cannot be deleted.');
    }

    if (await this.rbacCatalog.roleHasAssignedUsers(roleId)) {
      return Result.failure('Role cannot be deleted while it is assigned.');
    }

    await this.rbacCatalog.deleteRole(roleId);

    return Result.success(undefined);
  }
}
