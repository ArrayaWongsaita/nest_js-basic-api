import { ResetAdminDataUseCase } from './reset-admin-data.use-case';

function createUseCase(allowed: boolean, users: Record<string, unknown> = {}) {
  const handler = {
    domainName: 'todo',
    reset: jest.fn().mockResolvedValue({ domain: 'todo', deletedRecords: 1 }),
  };
  const adminUserManagement = {
    findById: jest.fn((id: string) => Promise.resolve(users[id] ?? null)),
    countActiveAdmins: jest.fn().mockResolvedValue(2),
    countSystemUsers: jest.fn().mockResolvedValue(1),
  };
  const rbacCatalog = {
    listRoles: jest.fn().mockResolvedValue([]),
    listPermissions: jest.fn().mockResolvedValue([]),
  };
  const useCase = new ResetAdminDataUseCase(
    [handler, { ...handler, domainName: 'iam' }] as never,
    adminUserManagement as never,
    rbacCatalog as never,
    { allowed },
  );

  return { useCase, handler, adminUserManagement };
}

const request = {
  actorUserId: 'admin-1',
  scope: 'global' as const,
  targetUserId: null,
  domains: ['todo'],
  mode: 'reset_to_demo_baseline' as const,
};

describe('ResetAdminDataUseCase production guard', () => {
  it('resets data when maintenance is allowed', async () => {
    const { useCase, handler } = createUseCase(true);

    const result = await useCase.execute(request);

    expect(result.ok).toBe(true);
    expect(handler.reset).toHaveBeenCalledTimes(1);
  });

  it('rejects the reset in production unless explicitly enabled', async () => {
    const { useCase, handler } = createUseCase(false);

    const result = await useCase.execute(request);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/production/i);
    expect(handler.reset).not.toHaveBeenCalled();
  });
});

function userView(overrides: Record<string, unknown>) {
  return {
    userId: 'u',
    isActive: true,
    isSystem: false,
    deletedAt: null,
    roles: [{ id: 'r', name: 'admin', isSystem: true }],
    ...overrides,
  };
}

describe('ResetAdminDataUseCase never-zero-admins rule', () => {
  const userScope = {
    ...request,
    scope: 'user' as const,
    domains: ['todo', 'iam'],
  };

  it('rejects a user-scoped reset that targets the acting admin', async () => {
    const { useCase, handler } = createUseCase(true, {
      'admin-1': userView({ userId: 'admin-1' }),
    });

    const result = await useCase.execute({
      ...userScope,
      targetUserId: 'admin-1',
    });

    expect(result.ok).toBe(false);
    expect(handler.reset).not.toHaveBeenCalled();
  });

  it('rejects resetting the last active admin through the iam domain', async () => {
    const { useCase, handler, adminUserManagement } = createUseCase(true, {
      'admin-2': userView({ userId: 'admin-2' }),
    });
    adminUserManagement.countActiveAdmins.mockResolvedValue(1);

    const result = await useCase.execute({
      ...userScope,
      targetUserId: 'admin-2',
    });

    expect(result.ok).toBe(false);
    expect(handler.reset).not.toHaveBeenCalled();
  });

  it('allows resetting another admin while more than one is active', async () => {
    const { useCase } = createUseCase(true, {
      'admin-2': userView({ userId: 'admin-2' }),
    });

    const result = await useCase.execute({
      ...userScope,
      targetUserId: 'admin-2',
    });

    expect(result.ok).toBe(true);
  });

  it('rejects a global iam reset when the acting admin is not a system user', async () => {
    const { useCase, handler } = createUseCase(true, {
      'admin-1': userView({ userId: 'admin-1' }),
    });

    const result = await useCase.execute({
      ...request,
      domains: ['todo', 'iam'],
    });

    expect(result.ok).toBe(false);
    expect(handler.reset).not.toHaveBeenCalled();
  });

  it('allows a global iam reset when the acting admin is a system user', async () => {
    const { useCase } = createUseCase(true, {
      'admin-1': userView({ userId: 'admin-1', isSystem: true }),
    });

    const result = await useCase.execute({
      ...request,
      domains: ['todo', 'iam'],
    });

    expect(result.ok).toBe(true);
  });
});
