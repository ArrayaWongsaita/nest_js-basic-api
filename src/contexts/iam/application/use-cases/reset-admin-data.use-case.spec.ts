import { ResetAdminDataUseCase } from './reset-admin-data.use-case';

function createUseCase(allowed: boolean) {
  const handler = {
    domainName: 'todo',
    reset: jest.fn().mockResolvedValue({ domain: 'todo', deletedRecords: 1 }),
  };
  const adminUserManagement = {
    findById: jest.fn(),
    countSystemUsers: jest.fn().mockResolvedValue(1),
  };
  const rbacCatalog = {
    listRoles: jest.fn().mockResolvedValue([]),
    listPermissions: jest.fn().mockResolvedValue([]),
  };
  const useCase = new ResetAdminDataUseCase(
    [handler] as never,
    adminUserManagement as never,
    rbacCatalog as never,
    { allowed },
  );

  return { useCase, handler };
}

const request = {
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
