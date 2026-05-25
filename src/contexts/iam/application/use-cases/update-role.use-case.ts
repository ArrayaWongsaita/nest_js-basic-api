import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { RoleName } from '../../domain/value-objects/role-name';
import { RbacCatalogPort, RoleView } from '../ports/rbac-catalog.port';
import { validatePermissionNames } from './create-role.use-case';

export interface UpdateRoleRequest {
  readonly roleId: string;
  readonly name: string;
  readonly permissionNames: readonly string[];
}

export class UpdateRoleUseCase
  implements UseCase<UpdateRoleRequest, Result<RoleView, string>>
{
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(
    request: UpdateRoleRequest,
  ): Promise<Result<RoleView, string>> {
    const role = await this.rbacCatalog.findRoleById(request.roleId);

    if (!role) {
      return Result.failure('Role was not found.');
    }

    if (role.isSystem) {
      return Result.failure('System roles cannot be modified.');
    }

    const normalizedRoleName = RoleName.create(request.name).toString();
    const conflictingRole = await this.rbacCatalog.findRoleByName(
      normalizedRoleName,
    );

    if (conflictingRole && conflictingRole.id !== request.roleId) {
      return Result.failure('Role already exists.');
    }

    const permissionValidationResult = await validatePermissionNames(
      this.rbacCatalog,
      request.permissionNames,
    );

    if (!permissionValidationResult.ok) {
      return Result.failure(permissionValidationResult.error);
    }

    const updatedRole = await this.rbacCatalog.updateRole({
      roleId: request.roleId,
      name: normalizedRoleName,
      permissionNames: permissionValidationResult.value,
    });

    if (!updatedRole) {
      return Result.failure('Role was not found.');
    }

    return Result.success(updatedRole);
  }
}
