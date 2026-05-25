import { UseCase } from '../../../../shared/application/use-case';
import { RbacCatalogPort, RoleView } from '../ports/rbac-catalog.port';

export class ListRolesUseCase implements UseCase<void, readonly RoleView[]> {
  constructor(private readonly rbacCatalog: RbacCatalogPort) {}

  async execute(): Promise<readonly RoleView[]> {
    return this.rbacCatalog.listRoles();
  }
}
