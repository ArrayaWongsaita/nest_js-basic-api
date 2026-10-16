import {
  FakeUserSeed,
  InMemoryIamAdmin,
} from '../testing/in-memory-iam-admin.fake';
import { UpdateAdminUserRolesUseCase } from './update-admin-user-roles.use-case';

function setup(users: readonly FakeUserSeed[]): UpdateAdminUserRolesUseCase {
  const admin = new InMemoryIamAdmin(users);

  return new UpdateAdminUserRolesUseCase(admin, admin);
}

describe('UpdateAdminUserRolesUseCase admin safety rules', () => {
  it('rejects removing the admin role from the acting admin own account', async () => {
    const useCase = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 'a1',
      roleNames: ['student'],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'Admins cannot remove the admin role from their own account.',
    );
  });

  it('rejects demoting the last active admin, even by another user', async () => {
    const useCase = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'ops', roleNames: ['editor'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'ops',
      userId: 'a1',
      roleNames: ['student'],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'The last active admin cannot lose the admin role.',
    );
  });

  it('allows demoting an admin while another active admin remains', async () => {
    const useCase = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 'a2',
      roleNames: ['student'],
    });

    expect(result.ok).toBe(true);
  });

  it('does not count an inactive admin as a remaining admin', async () => {
    const useCase = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'], isActive: false },
      { userId: 'ops', roleNames: ['editor'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'ops',
      userId: 'a1',
      roleNames: ['student'],
    });

    expect(result.ok).toBe(false);
  });

  it('allows an admin to change own roles while keeping the admin role', async () => {
    const useCase = setup([{ userId: 'a1', roleNames: ['admin'] }]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 'a1',
      roleNames: ['admin', 'editor'],
    });

    expect(result.ok).toBe(true);
  });

  it('allows changing roles of a non-admin user', async () => {
    const useCase = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 's1',
      roleNames: ['editor'],
    });

    expect(result.ok).toBe(true);
  });
});
