import type { AppConfig } from '../../../../bootstrap/config/app-config';
import { DEFAULT_ROLE_NAMES } from '../../domain/constants/role-name.constants';
import { DEFAULT_PERMISSION_NAMES } from '../../domain/constants/permission-name.constants';
import {
  IAM_DEMO_STUDENT_SEED,
  seedIamDemoUsers,
} from './seed-iam-demo-users';

class TestPasswordHasher {
  hash(rawPassword: string): Promise<string> {
    return Promise.resolve(`hashed:${rawPassword}`);
  }
}

function createAppConfig(): AppConfig {
  return {
    environment: 'test',
    http: { port: 3000 },
    database: { url: 'postgresql://example.invalid/db' },
    cors: { allowedOrigins: [] },
    auth: {
      accessTokenSecret: 'secret',
      accessTokenTtlSeconds: 900,
      refreshCookieName: 'refresh_token',
      refreshTokenTtlSeconds: 60 * 60 * 24 * 30,
      bootstrapAdmin: null,
    },
    swagger: {
      enabled: false,
      username: null,
      password: null,
    },
  };
}

function createPrismaMock() {
  return {
    permission: {
      upsert: jest.fn(),
      findUniqueOrThrow: jest.fn(async ({ where }: { where: { name: string } }) => ({
        id: `permission:${where.name}`,
      })),
    },
    role: {
      upsert: jest.fn(),
      findUniqueOrThrow: jest.fn(async ({ where }: { where: { name: string } }) => ({
        id: `role:${where.name}`,
      })),
    },
    rolePermission: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  };
}

describe('seedIamDemoUsers', () => {
  it('seeds baseline IAM roles and permissions before demo users', async () => {
    const prisma = createPrismaMock();

    await seedIamDemoUsers(
      prisma as never,
      new TestPasswordHasher() as never,
      createAppConfig(),
    );

    expect(prisma.permission.upsert).toHaveBeenCalledTimes(
      DEFAULT_PERMISSION_NAMES.length,
    );
    expect(prisma.role.upsert).toHaveBeenCalledTimes(DEFAULT_ROLE_NAMES.length);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(
      IAM_DEMO_STUDENT_SEED.endIndex,
    );
  });

  it('reconciles seeded students to the expected email, password, flags, and role', async () => {
    const prisma = createPrismaMock();

    await seedIamDemoUsers(
      prisma as never,
      new TestPasswordHasher() as never,
      createAppConfig(),
    );

    expect(prisma.user.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { email: 'student1@mail.com' },
        create: expect.objectContaining({
          email: 'student1@mail.com',
          passwordHash: `hashed:${IAM_DEMO_STUDENT_SEED.password}`,
          isActive: true,
          isSystem: false,
        }),
        update: expect.objectContaining({
          passwordHash: `hashed:${IAM_DEMO_STUDENT_SEED.password}`,
          isActive: true,
          isSystem: false,
          roles: expect.objectContaining({
            deleteMany: {},
          }),
        }),
      }),
    );

    expect(prisma.user.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { email: 'student60@mail.com' },
      }),
    );
  });
});
