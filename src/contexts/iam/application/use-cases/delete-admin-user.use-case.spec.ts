import {
  FakeUserSeed,
  InMemoryIamAdmin,
} from '../testing/in-memory-iam-admin.fake';
import { DeleteAdminUserUseCase } from './delete-admin-user.use-case';
import { RestoreAdminUserUseCase } from './restore-admin-user.use-case';

function setup(users: readonly FakeUserSeed[]) {
  const admin = new InMemoryIamAdmin(users);

  return {
    admin,
    deleteUser: new DeleteAdminUserUseCase(admin),
    restoreUser: new RestoreAdminUserUseCase(admin),
  };
}

describe('DeleteAdminUserUseCase', () => {
  it('soft-deletes a user and removes their session', async () => {
    const { admin, deleteUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'] },
    ]);
    admin.seedSession('s1');

    const result = await deleteUser.execute({
      actorUserId: 'a1',
      userId: 's1',
    });

    expect(result.ok).toBe(true);
    expect(result.value?.deletedAt).toBeInstanceOf(Date);
    expect(admin.hasSession('s1')).toBe(false);
  });

  it('hides a deleted user from the default list but keeps it retrievable', async () => {
    const { admin, deleteUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'] },
    ]);

    await deleteUser.execute({ actorUserId: 'a1', userId: 's1' });

    const visible = await admin.listUsers({});
    const all = await admin.listUsers({ includeDeleted: true });

    expect(visible.items.map((user) => user.userId)).toEqual(['a1']);
    expect(all.items.map((user) => user.userId).sort()).toEqual(['a1', 's1']);
  });

  it('rejects deleting the acting admin own account', async () => {
    const { admin, deleteUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'] },
    ]);
    admin.seedSession('a1');

    const result = await deleteUser.execute({
      actorUserId: 'a1',
      userId: 'a1',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Admins cannot delete their own account.');
    expect(admin.hasSession('a1')).toBe(true);
  });

  it('rejects deleting a system user', async () => {
    const { deleteUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'sys', roleNames: ['student'], isSystem: true },
    ]);

    const result = await deleteUser.execute({
      actorUserId: 'a1',
      userId: 'sys',
    });

    expect(result.error).toBe('System users cannot be deleted.');
  });

  it('rejects deleting the last active admin, even by another user', async () => {
    const { deleteUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'], isActive: false },
      { userId: 'ops', roleNames: ['editor'] },
    ]);

    const result = await deleteUser.execute({
      actorUserId: 'ops',
      userId: 'a1',
    });

    expect(result.error).toBe('The last active admin cannot be deleted.');
  });

  it('allows deleting an admin while another active admin remains', async () => {
    const { deleteUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 'a2', roleNames: ['admin'] },
    ]);

    const result = await deleteUser.execute({
      actorUserId: 'a1',
      userId: 'a2',
    });

    expect(result.ok).toBe(true);
  });

  it('reports a missing user as not found', async () => {
    const { deleteUser } = setup([{ userId: 'a1', roleNames: ['admin'] }]);

    const result = await deleteUser.execute({
      actorUserId: 'a1',
      userId: 'nope',
    });

    expect(result.error).toBe('User was not found.');
  });

  it('rejects deleting an already deleted user', async () => {
    const { deleteUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'], isDeleted: true },
    ]);

    const result = await deleteUser.execute({
      actorUserId: 'a1',
      userId: 's1',
    });

    expect(result.error).toBe('User is already deleted.');
  });
});

describe('RestoreAdminUserUseCase', () => {
  it('restores a deleted user', async () => {
    const { admin, restoreUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'], isDeleted: true },
    ]);

    const result = await restoreUser.execute({
      actorUserId: 'a1',
      userId: 's1',
    });

    expect(result.ok).toBe(true);
    expect(result.value?.deletedAt).toBeNull();
    expect((await admin.listUsers({})).items).toHaveLength(2);
  });

  it('rejects restoring a user who is not deleted', async () => {
    const { restoreUser } = setup([
      { userId: 'a1', roleNames: ['admin'] },
      { userId: 's1', roleNames: ['student'] },
    ]);

    const result = await restoreUser.execute({
      actorUserId: 'a1',
      userId: 's1',
    });

    expect(result.error).toBe('User is not deleted.');
  });

  it('reports a missing user as not found', async () => {
    const { restoreUser } = setup([{ userId: 'a1', roleNames: ['admin'] }]);

    const result = await restoreUser.execute({
      actorUserId: 'a1',
      userId: 'nope',
    });

    expect(result.error).toBe('User was not found.');
  });
});
