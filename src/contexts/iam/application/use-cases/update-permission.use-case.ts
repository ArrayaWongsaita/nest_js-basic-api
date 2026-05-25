import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { PermissionName } from '../../domain/value-objects/permission-name';
import { PermissionView, RbacCatalogPort } from '../ports/rbac-catalog.port';

export interface UpdatePermissionRequest {
  readonly permissionId: string;
  readonly name: string;
}

export class UpdatePermissionUseCase
  implements UseCase<UpdatePermissionRequest, Result<PermissionView, string>>
{
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(
    request: UpdatePermissionRequest,
  ): Promise<Result<PermissionView, string>> {
    const permission = await this.rbacCatalog.findPermissionById(
      request.permissionId,
    );

    if (!permission) {
      return Result.failure('Permission was not found.');
    }

    if (permission.isSystem) {
      return Result.failure('System permissions cannot be modified.');
    }

    const normalizedName = PermissionName.create(request.name).toString();
    const conflictingPermission = await this.rbacCatalog.findPermissionByName(
      normalizedName,
    );

    if (
      conflictingPermission &&
      conflictingPermission.id !== request.permissionId
    ) {
      return Result.failure('Permission already exists.');
    }

    const updatedPermission = await this.rbacCatalog.updatePermission({
      permissionId: request.permissionId,
      name: normalizedName,
    });

    if (!updatedPermission) {
      return Result.failure('Permission was not found.');
    }

    return Result.success(updatedPermission);
  }
}
