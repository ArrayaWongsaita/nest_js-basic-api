import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { PermissionName } from '../../domain/value-objects/permission-name';
import { PermissionView, RbacCatalogPort } from '../ports/rbac-catalog.port';

export class CreatePermissionUseCase
  implements UseCase<string, Result<PermissionView, string>>
{
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(name: string): Promise<Result<PermissionView, string>> {
    const permissionName = PermissionName.create(name).toString();
    const existingPermission = await this.rbacCatalog.findPermissionByName(
      permissionName,
    );

    if (existingPermission) {
      return Result.failure('Permission already exists.');
    }

    return Result.success(
      await this.rbacCatalog.createPermission({
        name: permissionName,
      }),
    );
  }
}
