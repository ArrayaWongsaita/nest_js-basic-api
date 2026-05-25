import { DemoUserSeedResult } from '../dto/demo-user-seed.result';
import { SeedDemoUsersUseCase } from './seed-demo-users.use-case';

describe('SeedDemoUsersUseCase', () => {
  it('delegates demo-user seeding to the configured port', async () => {
    const expectedResult: DemoUserSeedResult = {
      totalUsers: 60,
      firstEmail: 'student1@mail.com',
      lastEmail: 'student60@mail.com',
      roleName: 'student',
      completedAt: new Date('2026-05-26T08:30:00.000Z'),
    };
    const demoUserSeedPort = {
      seedDemoUsers: jest.fn().mockResolvedValue(expectedResult),
    };

    const useCase = new SeedDemoUsersUseCase(demoUserSeedPort);

    await expect(useCase.execute()).resolves.toEqual(expectedResult);
    expect(demoUserSeedPort.seedDemoUsers).toHaveBeenCalledTimes(1);
  });
});
