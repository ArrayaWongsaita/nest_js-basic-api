import { Entity } from '../../../../shared/domain/entity';
import { PermissionName } from '../value-objects/permission-name';
import { RoleName } from '../value-objects/role-name';

interface RoleProps {
  name: RoleName;
  permissions: PermissionName[];
}

export class Role extends Entity<RoleProps> {
  get name(): RoleName {
    return this.props.name;
  }

  get permissions(): PermissionName[] {
    return [...this.props.permissions];
  }
}
