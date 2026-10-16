import {
  FakeUserSeed,
  InMemoryIamAdmin,
} from '../testing/in-memory-iam-admin.fake';
import { UpdateAdminUserStatusUseCase } from './update-admin-user-status.use-case';

function setup(users: readonly FakeUserSeed[]): {
  admin: InMemoryIamAdmin;
  useCase: UpdateAdminUserStatusUseCase;
} {
  const admin = new InMemoryIamAdmin(users);

  return { admin, useCase: new UpdateAdminUserStatusUseCase(admin) };
}

describe('UpdateAdminUserStatusUseCase admin safety rules', () => {
  it('rejects deactivating the acting admin own account', async () => {
    const { useCase } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 'a1',
      isActive: false,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Admins cannot deactivate their own account.');
  });

  it('rejects deactivating the last active admin, even by another user', async () => {
    const { useCase } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'], isActive: false },
      { userId: 'ops', roleNames: ['editor'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'ops',
      userId: 'a1',
      isActive: false,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('The last active admin cannot be deactivated.');
  });

  it('allows deactivating an admin while another active admin remains', async () => {
    const { admin, useCase } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 'a2',
      isActive: false,
    });

    expect(result.ok).toBe(true);
    expect(await admin.countActiveAdmins()).toBe(1);
  });

  it('allows deactivating a non-admin user', async () => {
    const { useCase } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'] },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 's1',
      isActive: false,
    });

    expect(result.ok).toBe(true);
  });

  it('allows reactivating a user', async () => {
    const { useCase } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'], isActive: false },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 'a2',
      isActive: true,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects deactivating a system user', async () => {
    const { useCase } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'sys', roleNames: ['student'], isSystem: true },
    ]);

    const result = await useCase.execute({
      actorUserId: 'a1',
      userId: 'sys',
      isActive: false,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('System users cannot be deactivated.');
  });
});
