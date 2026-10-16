import {
  FakeUserSeed,
  InMemoryIamAdmin,
} from '../testing/in-memory-iam-admin.fake';
import { UpdateAdminUserRolesUseCase } from './update-admin-user-roles.use-case';

function setup(users: readonly FakeUserSeed[]): {
  admin: InMemoryIamAdmin;
  useCase: UpdateAdminUserRolesUseCase;
} {
  const admin = new InMemoryIamAdmin(users);

  return { admin, useCase: new UpdateAdminUserRolesUseCase(admin, admin) };
}

describe('UpdateAdminUserRolesUseCase session revocation', () => {
  it('removes the session of a user whose roles changed', async () => {
    const { admin, useCase } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'] },
    ]);
    admin.seedSession('s1');

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 's1',
      roleNames: ['editor'],
    });

    expect(result.ok).toBe(true);
    expect(admin.hasSession('s1')).toBe(false);
  });

  it('keeps the session when the role change is rejected', async () => {
    const { admin, useCase } = setup([{ userId: 'a1', roleNames: ['admin'] }]);
    admin.seedSession('a1');

    await useCase.execute({
      actorUserId: 'a1',
      userId: 'a1',
      roleNames: ['student'],
    });

    expect(admin.hasSession('a1')).toBe(true);
  });
});
