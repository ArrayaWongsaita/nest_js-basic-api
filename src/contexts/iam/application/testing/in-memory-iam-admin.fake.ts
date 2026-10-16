import {
  AdminUserManagementPort,
  AdminUserView,
  PaginatedAdminUsers,
} from '../ports/admin-user-management.port';
import {
  PermissionView,
  RbacCatalogPort,
  RoleView,
} from '../ports/rbac-catalog.port';

export interface FakeUserSeed {
  readonly userId: string;
  readonly roleNames?: readonly string[];
  readonly isActive?: boolean;
  readonly isSystem?: boolean;
}

const KNOWN_ROLE_NAMES = ['admin', 'student', 'editor'];

export function createFakeUser(seed: FakeUserSeed): AdminUserView {
  return {
    userId: seed.userId,
    email: `${seed.userId}@example.com`,
    isActive: seed.isActive ?? true,
    isSystem: seed.isSystem ?? false,
    roles: (seed.roleNames ?? ['student']).map((name) => ({
      id: roleIdFor(name),
      name,
      isSystem: name === 'admin' || name === 'student',
    })),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

/**
 * In-memory stand-in for the admin user management and RBAC catalog ports.
 * Only the operations needed by user status and role use cases are real;
 * the rest are inert.
 */
export class InMemoryIamAdmin
  implements AdminUserManagementPort, RbacCatalogPort
{
  private readonly users = new Map<string, AdminUserView>();

  constructor(seeds: readonly FakeUserSeed[]) {
    for (const seed of seeds) {
      this.users.set(seed.userId, createFakeUser(seed));
    }
  }

  findByEmail(email: string): Promise<AdminUserView | null> {
    return Promise.resolve(
      [...this.users.values()].find((user) => user.email === email) ?? null,
    );
  }

  findById(userId: string): Promise<AdminUserView | null> {
    return Promise.resolve(this.users.get(userId) ?? null);
  }

  listUsers(): Promise<PaginatedAdminUsers> {
    const items = [...this.users.values()];

    return Promise.resolve({ items, totalItems: items.length });
  }

  createUser(): Promise<AdminUserView> {
    return Promise.reject(new Error('Not supported by the fake.'));
  }

  updateUserRoles(
    userId: string,
    roleNames: readonly string[],
  ): Promise<AdminUserView | null> {
    const user = this.users.get(userId);

    if (!user) {
      return Promise.resolve(null);
    }

    const updated = createFakeUser({
      userId,
      roleNames,
      isActive: user.isActive,
      isSystem: user.isSystem,
    });
    this.users.set(userId, updated);

    return Promise.resolve(updated);
  }

  updateUserStatus(
    userId: string,
    isActive: boolean,
  ): Promise<AdminUserView | null> {
    const user = this.users.get(userId);

    if (!user) {
      return Promise.resolve(null);
    }

    const updated = { ...user, isActive };
    this.users.set(userId, updated);

    return Promise.resolve(updated);
  }

  countActiveAdmins(): Promise<number> {
    return Promise.resolve(
      [...this.users.values()].filter(
        (user) =>
          user.isActive && user.roles.some((role) => role.name === 'admin'),
      ).length,
    );
  }

  countSystemUsers(): Promise<number> {
    return Promise.resolve(
      [...this.users.values()].filter((user) => user.isSystem).length,
    );
  }

  clearAuthSessionsForUser(): Promise<number> {
    return Promise.resolve(0);
  }

  clearAllAuthSessions(): Promise<number> {
    return Promise.resolve(0);
  }

  deleteNonSystemUserById(): Promise<number> {
    return Promise.resolve(0);
  }

  deleteNonSystemUsers(): Promise<number> {
    return Promise.resolve(0);
  }

  listRoles(): Promise<readonly RoleView[]> {
    return Promise.resolve(KNOWN_ROLE_NAMES.map(toRole));
  }

  findRoleById(): Promise<RoleView | null> {
    return Promise.resolve(null);
  }

  findRoleByName(name: string): Promise<RoleView | null> {
    return Promise.resolve(
      KNOWN_ROLE_NAMES.includes(name) ? toRole(name) : null,
    );
  }

  createRole(): Promise<RoleView> {
    return Promise.reject(new Error('Not supported by the fake.'));
  }

  updateRole(): Promise<RoleView | null> {
    return Promise.resolve(null);
  }

  deleteRole(): Promise<boolean> {
    return Promise.resolve(false);
  }

  roleHasAssignedUsers(): Promise<boolean> {
    return Promise.resolve(false);
  }

  listPermissions(): Promise<readonly PermissionView[]> {
    return Promise.resolve([]);
  }

  findPermissionById(): Promise<PermissionView | null> {
    return Promise.resolve(null);
  }

  findPermissionByName(): Promise<PermissionView | null> {
    return Promise.resolve(null);
  }

  createPermission(): Promise<PermissionView> {
    return Promise.reject(new Error('Not supported by the fake.'));
  }

  updatePermission(): Promise<PermissionView | null> {
    return Promise.resolve(null);
  }

  deletePermission(): Promise<boolean> {
    return Promise.resolve(false);
  }

  permissionIsAssignedToRoles(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

function toRole(name: string): RoleView {
  return {
    id: roleIdFor(name),
    name,
    isSystem: name === 'admin' || name === 'student',
    permissions: [],
  };
}

function roleIdFor(name: string): string {
  const index = KNOWN_ROLE_NAMES.indexOf(name);

  return `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
}
