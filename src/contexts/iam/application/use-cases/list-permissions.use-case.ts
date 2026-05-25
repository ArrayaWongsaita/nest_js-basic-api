import { UseCase } from '../../../../shared/application/use-case';
import { PermissionView, RbacCatalogPort } from '../ports/rbac-catalog.port';

export class ListPermissionsUseCase
  implements UseCase<void, readonly PermissionView[]>
{
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(): Promise<readonly PermissionView[]> {
    return this.rbacCatalog.listPermissions();
  }
}
