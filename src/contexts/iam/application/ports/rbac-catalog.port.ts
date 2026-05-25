export interface PermissionView {
  readonly id: string;
  readonly name: string;
  readonly isSystem: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface RoleView {
  readonly id: string;
  readonly name: string;
  readonly isSystem: boolean;
  readonly permissions: readonly PermissionView[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface CreateRoleInput {
  readonly name: string;
  readonly permissionNames: readonly string[];
}

export interface UpdateRoleInput {
  readonly roleId: string;
  readonly name: string;
  readonly permissionNames: readonly string[];
}

export interface CreatePermissionInput {
  readonly name: string;
}

export interface UpdatePermissionInput {
  readonly permissionId: string;
  readonly name: string;
}

export interface RbacCatalogPort {
  listRoles(): Promise<readonly RoleView[]>;
  findRoleById(roleId: string): Promise<RoleView | null>;
  findRoleByName(name: string): Promise<RoleView | null>;
  createRole(input: CreateRoleInput): Promise<RoleView>;
  updateRole(input: UpdateRoleInput): Promise<RoleView | null>;
  deleteRole(roleId: string): Promise<boolean>;
  roleHasAssignedUsers(roleId: string): Promise<boolean>;
  listPermissions(): Promise<readonly PermissionView[]>;
  findPermissionById(permissionId: string): Promise<PermissionView | null>;
  findPermissionByName(name: string): Promise<PermissionView | null>;
  createPermission(input: CreatePermissionInput): Promise<PermissionView>;
  updatePermission(
    input: UpdatePermissionInput,
  ): Promise<PermissionView | null>;
  deletePermission(permissionId: string): Promise<boolean>;
  permissionIsAssignedToRoles(permissionId: string): Promise<boolean>;
}
