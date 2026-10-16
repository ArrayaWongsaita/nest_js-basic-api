import type { AppConfig } from '../../../../bootstrap/config/app-config';
import { DEFAULT_ROLE_PERMISSION_MAP } from '../../domain/constants/role-permission-map';
import {
  ADMIN_ROLE_NAME,
  STUDENT_ROLE_NAME,
} from '../../domain/constants/role-name.constants';
import { seedIamAuthData } from './seed-iam-auth';

const passwordHasher = {
  hash: (raw: string) => Promise.resolve(`hashed:${raw}`),
};

const appConfig = {
  auth: { bootstrapAdmin: null },
} as unknown as AppConfig;

interface Grant {
  role: string;
  permission: string;
}

/** In-memory stand-in for the Prisma tables the seed touches. */
function createFakePrisma(initialGrants: Grant[] = []) {
  const grants = new Map<string, Grant>();
  const key = (g: Grant) => `${g.role}|${g.permission}`;
  initialGrants.forEach((g) => grants.set(key(g), g));

  const nameOf = (id: string) => id.slice(id.indexOf(':') + 1);

  const prisma = {
    permission: {
      upsert: async () => undefined,
      findUniqueOrThrow: async ({ where }: { where: { name: string } }) => ({
        id: `permission:${where.name}`,
      }),
    },
    role: {
      upsert: async () => undefined,
      findUniqueOrThrow: async ({ where }: { where: { name: string } }) => ({
        id: `role:${where.name}`,
      }),
    },
    rolePermission: {
      deleteMany: async ({ where }: { where: { role: { name: string } } }) => {
        for (const [k, g] of [...grants]) {
          if (g.role === where.role.name) grants.delete(k);
        }
      },
      upsert: async ({
        where,
      }: {
        where: {
          roleId_permissionId: { roleId: string; permissionId: string };
        };
      }) => {
        const grant = {
          role: nameOf(where.roleId_permissionId.roleId),
          permission: nameOf(where.roleId_permissionId.permissionId),
        };
        grants.set(key(grant), grant);
      },
    },
    user: { upsert: async () => undefined },
  };

  const permissionsOf = (role: string) =>
    [...grants.values()]
      .filter((g) => g.role === role)
      .map((g) => g.permission);

  return { prisma, permissionsOf };
}

describe('seedIamAuthData', () => {
  it('grants every default permission to system roles on first run', async () => {
    const { prisma, permissionsOf } = createFakePrisma();

    await seedIamAuthData(prisma as never, passwordHasher as never, appConfig);

    expect(permissionsOf(ADMIN_ROLE_NAME).sort()).toEqual(
      [...DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]].sort(),
    );
    expect(permissionsOf(STUDENT_ROLE_NAME).sort()).toEqual(
      [...DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]].sort(),
    );
  });

  it('is idempotent when run repeatedly', async () => {
    const { prisma, permissionsOf } = createFakePrisma();

    await seedIamAuthData(prisma as never, passwordHasher as never, appConfig);
    const firstRun = permissionsOf(ADMIN_ROLE_NAME).sort();
    await seedIamAuthData(prisma as never, passwordHasher as never, appConfig);

    expect(permissionsOf(ADMIN_ROLE_NAME).sort()).toEqual(firstRun);
  });

  it('only adds missing grants and never removes existing ones from system roles', async () => {
    const { prisma, permissionsOf } = createFakePrisma([
      { role: STUDENT_ROLE_NAME, permission: 'custom.extra.permission' },
    ]);

    await seedIamAuthData(prisma as never, passwordHasher as never, appConfig);

    expect(permissionsOf(STUDENT_ROLE_NAME)).toContain(
      'custom.extra.permission',
    );
    expect(permissionsOf(STUDENT_ROLE_NAME)).toEqual(
      expect.arrayContaining([
        ...DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME],
      ]),
    );
  });

  it('does not touch the permissions of custom roles', async () => {
    const customGrants = [
      { role: 'moderator', permission: 'iam.users.read' },
      { role: 'moderator', permission: 'custom.extra.permission' },
    ];
    const { prisma, permissionsOf } = createFakePrisma(customGrants);

    await seedIamAuthData(prisma as never, passwordHasher as never, appConfig);

    expect(permissionsOf('moderator').sort()).toEqual(
      customGrants.map((g) => g.permission).sort(),
    );
  });
});
