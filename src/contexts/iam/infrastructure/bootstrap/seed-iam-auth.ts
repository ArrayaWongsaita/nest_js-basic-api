import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { AppConfig } from '../../../../bootstrap/config/app-config';
import type { PasswordHasher } from '../../application/ports/password-hasher.port';
import { DEFAULT_PERMISSION_NAMES } from '../../domain/constants/permission-name.constants';
import { DEFAULT_ROLE_PERMISSION_MAP } from '../../domain/constants/role-permission-map';
import { ADMIN_ROLE_NAME, DEFAULT_ROLE_NAMES } from '../../domain/constants/role-name.constants';

export async function seedIamAuthData(
  prisma: PrismaService,
  passwordHasher: PasswordHasher,
  appConfig: AppConfig,
): Promise<void> {
  for (const permissionName of DEFAULT_PERMISSION_NAMES) {
    await prisma.permission.upsert({
      where: {
        name: permissionName,
      },
      create: {
        name: permissionName,
        isSystem: true,
      },
      update: {
        isSystem: true,
      },
    });
  }

  for (const roleName of DEFAULT_ROLE_NAMES) {
    await prisma.role.upsert({
      where: {
        name: roleName,
      },
      create: {
        name: roleName,
        isSystem: true,
      },
      update: {
        isSystem: true,
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: roleName,
        },
      },
    });

    for (const permissionName of DEFAULT_ROLE_PERMISSION_MAP[roleName]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: (
              await prisma.role.findUniqueOrThrow({
                where: { name: roleName },
                select: { id: true },
              })
            ).id,
            permissionId: (
              await prisma.permission.findUniqueOrThrow({
                where: { name: permissionName },
                select: { id: true },
              })
            ).id,
          },
        },
        create: {
          role: {
            connect: {
              name: roleName,
            },
          },
          permission: {
            connect: {
              name: permissionName,
            },
          },
        },
        update: {},
      });
    }
  }

  if (!appConfig.auth.bootstrapAdmin) {
    return;
  }

  const passwordHash = await passwordHasher.hash(
    appConfig.auth.bootstrapAdmin.password,
  );

  await prisma.user.upsert({
    where: {
      email: appConfig.auth.bootstrapAdmin.email,
    },
    create: {
      email: appConfig.auth.bootstrapAdmin.email,
      passwordHash,
      isActive: true,
      isSystem: true,
      roles: {
        create: [
          {
            role: {
              connect: {
                name: ADMIN_ROLE_NAME,
              },
            },
          },
        ],
      },
    },
    update: {
      passwordHash,
      isActive: true,
      isSystem: true,
      roles: {
        deleteMany: {},
        create: [
          {
            role: {
              connect: {
                name: ADMIN_ROLE_NAME,
              },
            },
          },
        ],
      },
    },
  });
}
