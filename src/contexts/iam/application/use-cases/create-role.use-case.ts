import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { RoleName } from '../../domain/value-objects/role-name';
import { RbacCatalogPort, RoleView } from '../ports/rbac-catalog.port';

export interface CreateRoleRequest {
  readonly name: string;
  readonly permissionNames: readonly string[];
}

export class CreateRoleUseCase
  implements UseCase<CreateRoleRequest, Result<RoleView, string>>
{
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(
    request: CreateRoleRequest,
  ): Promise<Result<RoleView, string>> {
    const roleName = RoleName.create(request.name).toString();
    const existingRole = await this.rbacCatalog.findRoleByName(roleName);

    if (existingRole) {
      return Result.failure('Role already exists.');
    }

    const permissionValidationResult = await validatePermissionNames(
      this.rbacCatalog,
      request.permissionNames,
    );

    if (!permissionValidationResult.ok) {
      return Result.failure(permissionValidationResult.error);
    }

    return Result.success(
      await this.rbacCatalog.createRole({
        name: roleName,
        permissionNames: permissionValidationResult.value,
      }),
    );
  }
}

export async function validatePermissionNames(
  rbacCatalog: RbacCatalogPort,
  permissionNames: readonly string[],
): Promise<Result<string[], string>> {
  const normalizedPermissionNames = permissionNames.map((permissionName) =>
    permissionName.trim().toLowerCase(),
  );
  const uniquePermissionNames = [...new Set(normalizedPermissionNames)];

  for (const permissionName of uniquePermissionNames) {
    const permission = await rbacCatalog.findPermissionByName(permissionName);

    if (!permission) {
      return Result.failure(`Permission "${permissionName}" was not found.`);
    }
  }

  return Result.success(uniquePermissionNames);
}
