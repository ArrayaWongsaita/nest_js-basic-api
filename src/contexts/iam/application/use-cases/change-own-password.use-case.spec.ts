import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { PasswordPolicyService } from '../../domain/services/password-policy.service';
import { PasswordHasher } from '../ports/password-hasher.port';
import { InMemoryCredentialStore } from '../testing/in-memory-credential-store.fake';
import { ChangeOwnPasswordUseCase } from './change-own-password.use-case';

const hasher: PasswordHasher = {
  hash: (raw) => Promise.resolve(`hashed:${raw}`),
  verify: (raw, hashed) => Promise.resolve(hashed === `hashed:${raw}`),
};

function setup(mustChangePassword = false) {
  const store = new InMemoryCredentialStore([
    {
      userId: 'user-1',
      passwordHash: 'hashed:current-password-1',
      mustChangePassword,
    },
  ]);
  const revokedUserIds: string[] = [];
  const sessions = {
    deleteByUserId: (userId: string) => {
      revokedUserIds.push(userId);
      return Promise.resolve();
    },
  } as unknown as AuthSessionRepository;
  const useCase = new ChangeOwnPasswordUseCase(
    store,
    store,
    hasher,
    new PasswordPolicyService(),
    sessions,
  );

  return { store, revokedUserIds, useCase };
}

describe('ChangeOwnPasswordUseCase', () => {
  it('changes the password, clears the forced-change flag and ends the session', async () => {
    const { store, revokedUserIds, useCase } = setup(true);

    const result = await useCase.execute({
      userId: 'user-1',
      currentPassword: 'current-password-1',
      newPassword: 'brand-new-password-2',
    });

    expect(result.ok).toBe(true);
    const stored = await store.findById('user-1');
    expect(stored?.passwordHash).toBe('hashed:brand-new-password-2');
    expect(stored?.mustChangePassword).toBe(false);
    expect(revokedUserIds).toEqual(['user-1']);
  });

  it('rejects a wrong current password and changes nothing', async () => {
    const { store, revokedUserIds, useCase } = setup();

    const result = await useCase.execute({
      userId: 'user-1',
      currentPassword: 'not-the-password',
      newPassword: 'brand-new-password-2',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Current password is incorrect.');
    expect((await store.findById('user-1'))?.passwordHash).toBe(
      'hashed:current-password-1',
    );
    expect(revokedUserIds).toEqual([]);
  });

  it('rejects a new password that fails the registration strength rules', async () => {
    const { store, useCase } = setup();

    const result = await useCase.execute({
      userId: 'user-1',
      currentPassword: 'current-password-1',
      newPassword: 'short',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Password must be at least 12 characters long.');
    expect((await store.findById('user-1'))?.passwordHash).toBe(
      'hashed:current-password-1',
    );
  });

  it('rejects reusing the current password', async () => {
    const { useCase } = setup(true);

    const result = await useCase.execute({
      userId: 'user-1',
      currentPassword: 'current-password-1',
      newPassword: 'current-password-1',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'New password must differ from the current password.',
    );
  });
});
