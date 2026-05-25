import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import {
  AdminAssignedRoleView,
  AdminUserListFilters,
  AdminUserManagementPort,
  AdminUserView,
  CreateAdminUserInput,
  PaginatedAdminUsers,
} from '../../../application/ports/admin-user-management.port';
import {
  CreatePermissionInput,
  CreateRoleInput,
  PermissionView,
  RbacCatalogPort,
  RoleView,
  UpdatePermissionInput,
  UpdateRoleInput,
} from '../../../application/ports/rbac-catalog.port';

@Injectable()
export class PrismaIamAdminGateway
  implements AdminUserManagementPort, RbacCatalogPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AdminUserView | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: adminUserInclude,
    });

    return mapAdminUserView(user);
  }

  async findById(userId: string): Promise<AdminUserView | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: adminUserInclude,
    });

    return mapAdminUserView(user);
  }

  async listUsers(
    filters: AdminUserListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedAdminUsers> {
    const where = createAdminUserWhereClause(filters);
    const skip = (page - 1) * limit;
    const [users, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: adminUserInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => mapAdminUserView(user)).filter(Boolean) as AdminUserView[],
      totalItems,
    };
  }

  async createUser(input: CreateAdminUserInput): Promise<AdminUserView> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        isActive: true,
        isSystem: false,
        roles: {
          create: input.roleNames.map((roleName) => ({
            role: {
              connect: {
                name: roleName,
              },
            },
          })),
        },
      },
      include: adminUserInclude,
    });

    return mapAdminUserView(user) as AdminUserView;
  }

  async updateUserRoles(
    userId: string,
    roleNames: readonly string[],
  ): Promise<AdminUserView | null> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          deleteMany: {},
          create: roleNames.map((roleName) => ({
            role: {
              connect: {
                name: roleName,
              },
            },
          })),
        },
      },
      include: adminUserInclude,
    }).catch(() => null);

    return mapAdminUserView(user);
  }

  async updateUserStatus(
    userId: string,
    isActive: boolean,
  ): Promise<AdminUserView | null> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: adminUserInclude,
    }).catch(() => null);

    return mapAdminUserView(user);
  }

  async countSystemUsers(): Promise<number> {
    return this.prisma.user.count({
      where: {
        isSystem: true,
      },
    });
  }

  async clearAuthSessionsForUser(userId: string): Promise<number> {
    const result = await this.prisma.authSession.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  async clearAllAuthSessions(): Promise<number> {
    const result = await this.prisma.authSession.deleteMany();

    return result.count;
  }

  async deleteNonSystemUserById(userId: string): Promise<number> {
    const result = await this.prisma.user.deleteMany({
      where: {
        id: userId,
        isSystem: false,
      },
    });

    return result.count;
  }

  async deleteNonSystemUsers(): Promise<number> {
    const result = await this.prisma.user.deleteMany({
      where: {
        isSystem: false,
      },
    });

    return result.count;
  }

  async listRoles(): Promise<readonly RoleView[]> {
    const roles = await this.prisma.role.findMany({
      include: roleInclude,
      orderBy: { name: 'asc' },
    });

    return roles.map(mapRoleView);
  }

  async findRoleById(roleId: string): Promise<RoleView | null> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: roleInclude,
    });

    return role ? mapRoleView(role) : null;
  }

  async findRoleByName(name: string): Promise<RoleView | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: roleInclude,
    });

    return role ? mapRoleView(role) : null;
  }

  async createRole(input: CreateRoleInput): Promise<RoleView> {
    const role = await this.prisma.role.create({
      data: {
        name: input.name,
        isSystem: false,
        permissions: {
          create: input.permissionNames.map((permissionName) => ({
            permission: {
              connect: {
                name: permissionName,
              },
            },
          })),
        },
      },
      include: roleInclude,
    });

    return mapRoleView(role);
  }

  async updateRole(input: UpdateRoleInput): Promise<RoleView | null> {
    const role = await this.prisma.role.update({
      where: { id: input.roleId },
      data: {
        name: input.name,
        permissions: {
          deleteMany: {},
          create: input.permissionNames.map((permissionName) => ({
            permission: {
              connect: {
                name: permissionName,
              },
            },
          })),
        },
      },
      include: roleInclude,
    }).catch(() => null);

    return role ? mapRoleView(role) : null;
  }

  async deleteRole(roleId: string): Promise<boolean> {
    await this.prisma.role.delete({
      where: { id: roleId },
    });

    return true;
  }

  async roleHasAssignedUsers(roleId: string): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: { roleId },
    });

    return count > 0;
  }

  async listPermissions(): Promise<readonly PermissionView[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });

    return permissions.map(mapPermissionView);
  }

  async findPermissionById(permissionId: string): Promise<PermissionView | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    return permission ? mapPermissionView(permission) : null;
  }

  async findPermissionByName(name: string): Promise<PermissionView | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { name },
    });

    return permission ? mapPermissionView(permission) : null;
  }

  async createPermission(input: CreatePermissionInput): Promise<PermissionView> {
    const permission = await this.prisma.permission.create({
      data: {
        name: input.name,
        isSystem: false,
      },
    });

    return mapPermissionView(permission);
  }

  async updatePermission(
    input: UpdatePermissionInput,
  ): Promise<PermissionView | null> {
    const permission = await this.prisma.permission.update({
      where: { id: input.permissionId },
      data: { name: input.name },
    }).catch(() => null);

    return permission ? mapPermissionView(permission) : null;
  }

  async deletePermission(permissionId: string): Promise<boolean> {
    await this.prisma.permission.delete({
      where: { id: permissionId },
    });

    return true;
  }

  async permissionIsAssignedToRoles(permissionId: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({
      where: { permissionId },
    });

    return count > 0;
  }
}

const adminUserInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} as const;

const roleInclude = {
  permissions: {
    include: {
      permission: true,
    },
  },
} as const;

function createAdminUserWhereClause(filters: AdminUserListFilters) {
  const trimmedSearch = filters.search?.trim();

  return {
    ...(trimmedSearch
      ? {
          OR: [
            {
              email: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
    ...(filters.isActive === undefined
      ? {}
      : {
          isActive: filters.isActive,
        }),
  };
}

function mapAdminUserView(
  user:
    | {
        id: string;
        email: string;
        isActive: boolean;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
        roles: Array<{
          role: {
            id: string;
            name: string;
            isSystem: boolean;
          };
        }>;
      }
    | null,
): AdminUserView | null {
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    isActive: user.isActive,
    isSystem: user.isSystem,
    roles: user.roles.map(mapAssignedRoleView),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapAssignedRoleView(assignment: {
  role: {
    id: string;
    name: string;
    isSystem: boolean;
  };
}): AdminAssignedRoleView {
  return {
    id: assignment.role.id,
    name: assignment.role.name,
    isSystem: assignment.role.isSystem,
  };
}

function mapRoleView(role: {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  permissions: Array<{
    permission: {
      id: string;
      name: string;
      isSystem: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    };
  }>;
}): RoleView {
  return {
    id: role.id,
    name: role.name,
    isSystem: role.isSystem,
    permissions: role.permissions.map((assignment) =>
      mapPermissionView(assignment.permission),
    ),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

function mapPermissionView(permission: {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}): PermissionView {
  return {
    id: permission.id,
    name: permission.name,
    isSystem: permission.isSystem,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  };
}
