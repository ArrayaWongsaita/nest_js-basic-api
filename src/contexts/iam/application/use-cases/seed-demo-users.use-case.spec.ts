import { DemoUserSeedResult } from '../dto/demo-user-seed.result';
import { SeedDemoUsersUseCase } from './seed-demo-users.use-case';

const expectedResult: DemoUserSeedResult = {
  totalUsers: 60,
  firstEmail: 'student1@mail.com',
  lastEmail: 'student60@mail.com',
  roleName: 'student',
  completedAt: new Date('2026-05-26T08:30:00.000Z'),
};

function createPort() {
  return { seedDemoUsers: jest.fn().mockResolvedValue(expectedResult) };
}

describe('SeedDemoUsersUseCase', () => {
  it('seeds demo users outside production', async () => {
    const port = createPort();
    const useCase = new SeedDemoUsersUseCase(port, { allowed: true });

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    expect(result.value).toEqual(expectedResult);
    expect(port.seedDemoUsers).toHaveBeenCalledTimes(1);
  });

  it('rejects seeding in production unless explicitly enabled', async () => {
    const port = createPort();
    const useCase = new SeedDemoUsersUseCase(port, { allowed: false });

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/production/i);
    expect(port.seedDemoUsers).not.toHaveBeenCalled();
  });
});
