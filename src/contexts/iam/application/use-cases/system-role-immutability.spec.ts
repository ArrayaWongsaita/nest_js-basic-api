import {
  PermissionView,
  RbacCatalogPort,
  RoleView,
  UpdateRoleInput,
} from '../ports/rbac-catalog.port';
import { DeleteRoleUseCase } from './delete-role.use-case';
import { UpdateRoleUseCase } from './update-role.use-case';

class InMemoryRbacCatalog implements RbacCatalogPort {
  private roles: RoleView[] = [
    { id: 'r-admin', name: 'admin', isSystem: true, permissions: [] },
    { id: 'r-student', name: 'student', isSystem: true, permissions: [] },
    { id: 'r-custom', name: 'auditor', isSystem: false, permissions: [] },
  ];
  private permissions: PermissionView[] = [
    { id: 'p1', name: 'iam.users.read', isSystem: true },
  ];

  listRoles = () => Promise.resolve(this.roles);
  findRoleById = (id: string) =>
    Promise.resolve(this.roles.find((r) => r.id === id) ?? null);
  findRoleByName = (name: string) =>
    Promise.resolve(this.roles.find((r) => r.name === name) ?? null);
  createRole = () => Promise.reject(new Error('unused'));
  updateRole(input: UpdateRoleInput) {
    const index = this.roles.findIndex((r) => r.id === input.roleId);
    if (index < 0) return Promise.resolve(null);
    const updated: RoleView = {
      ...this.roles[index],
      name: input.name,
      permissions: this.permissions.filter((p) =>
        input.permissionNames.includes(p.name),
      ),
    };
    this.roles[index] = updated;
    return Promise.resolve(updated);
  }
  deleteRole(id: string) {
    this.roles = this.roles.filter((r) => r.id !== id);
    return Promise.resolve(true);
  }
  roleHasAssignedUsers = () => Promise.resolve(false);
  listPermissions = () => Promise.resolve(this.permissions);
  findPermissionById = () => Promise.resolve(null);
  findPermissionByName = (name: string) =>
    Promise.resolve(this.permissions.find((p) => p.name === name) ?? null);
  createPermission = () => Promise.reject(new Error('unused'));
  updatePermission = () => Promise.resolve(null);
  deletePermission = () => Promise.resolve(false);
  permissionIsAssignedToRoles = () => Promise.resolve(false);
}

describe('system role immutability', () => {
  it.each(['r-admin', 'r-student'])(
    'rejects editing system role %s',
    async (roleId) => {
      const catalog = new InMemoryRbacCatalog();
      const result = await new UpdateRoleUseCase(catalog).execute({
        roleId,
        name: 'renamed',
        permissionNames: [],
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe('System roles cannot be modified.');
      expect((await catalog.findRoleById(roleId))?.name).not.toBe('renamed');
    },
  );

  it.each(['r-admin', 'r-student'])(
    'rejects deleting system role %s',
    async (roleId) => {
      const catalog = new InMemoryRbacCatalog();
      const result = await new DeleteRoleUseCase(catalog).execute(roleId);

      expect(result.ok).toBe(false);
      expect(result.error).toBe('System roles cannot be deleted.');
      expect(await catalog.findRoleById(roleId)).not.toBeNull();
    },
  );

  it('still allows editing a custom role', async () => {
    const catalog = new InMemoryRbacCatalog();
    const result = await new UpdateRoleUseCase(catalog).execute({
      roleId: 'r-custom',
      name: 'reviewer',
      permissionNames: ['iam.users.read'],
    });

    expect(result.ok).toBe(true);
    expect((await catalog.findRoleById('r-custom'))?.name).toBe('reviewer');
  });

  it('still allows deleting a custom role', async () => {
    const catalog = new InMemoryRbacCatalog();
    const result = await new DeleteRoleUseCase(catalog).execute('r-custom');

    expect(result.ok).toBe(true);
    expect(await catalog.findRoleById('r-custom')).toBeNull();
  });
});
