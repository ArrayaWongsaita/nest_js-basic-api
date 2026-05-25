import { ConflictException } from '@nestjs/common';
import { AdminDemoUserSeedsController } from './admin-demo-user-seeds.controller';

describe('AdminDemoUserSeedsController', () => {
  it('returns a success envelope with the demo-user seed summary', async () => {
    const seedDemoUsersUseCase = {
      execute: jest.fn().mockResolvedValue({
        totalUsers: 60,
        firstEmail: 'student1@mail.com',
        lastEmail: 'student60@mail.com',
        roleName: 'student',
        completedAt: new Date('2026-05-26T08:30:00.000Z'),
      }),
    };

    const controller = new AdminDemoUserSeedsController(
      seedDemoUsersUseCase as never,
    );

    await expect(controller.createSeed()).resolves.toEqual({
      success: true,
      data: {
        totalUsers: 60,
        firstEmail: 'student1@mail.com',
        lastEmail: 'student60@mail.com',
        roleName: 'student',
        completedAt: '2026-05-26T08:30:00.000Z',
      },
    });
  });

  it('maps Prisma schema drift to a conflict response with remediation', async () => {
    const seedDemoUsersUseCase = {
      execute: jest.fn().mockRejectedValue({
        code: 'P2022',
      }),
    };

    const controller = new AdminDemoUserSeedsController(
      seedDemoUsersUseCase as never,
    );

    await expect(controller.createSeed()).rejects.toThrow(ConflictException);
    await expect(controller.createSeed()).rejects.toThrow(
      'Database schema is behind the Prisma schema. Run "pnpm run prisma:db:push" and retry.',
    );
  });
});
