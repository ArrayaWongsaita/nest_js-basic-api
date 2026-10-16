import { InMemoryCredentialStore } from '../testing/in-memory-credential-store.fake';
import { InMemoryIamAdmin } from '../testing/in-memory-iam-admin.fake';
import { PasswordHasher } from '../ports/password-hasher.port';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator.port';
import { ResetAdminUserPasswordUseCase } from './reset-admin-user-password.use-case';

const hasher: PasswordHasher = {
  hash: (raw) => Promise.resolve(`hashed:${raw}`),
  verify: (raw, hashed) => Promise.resolve(hashed === `hashed:${raw}`),
};
const generator: OpaqueTokenGenerator = {
  generate: () => Promise.resolve('generated-temporary-password'),
};

function setup() {
  const admin = new InMemoryIamAdmin([
    { userId: 'admin-1', roleNames: ['admin'] },
    { userId: 'student-1' },
  ]);
  const store = new InMemoryCredentialStore([
    { userId: 'student-1', passwordHash: 'hashed:old-password-123' },
  ]);
  const useCase = new ResetAdminUserPasswordUseCase(
    admin,
    store,
    hasher,
    generator,
  );

  return { admin, store, useCase };
}

describe('ResetAdminUserPasswordUseCase', () => {
  it('returns a temporary password, forces a change and revokes the session', async () => {
    const { admin, store, useCase } = setup();
    admin.seedSession('student-1');

    const result = await useCase.execute({
      actorUserId: 'admin-1',
      userId: 'student-1',
    });

    expect(result.ok).toBe(true);
    expect(result.value).toEqual({
      userId: 'student-1',
      temporaryPassword: 'generated-temporary-password',
    });
    const stored = await store.findById('student-1');
    expect(stored?.mustChangePassword).toBe(true);
    expect(
      await hasher.verify('generated-temporary-password', stored!.passwordHash),
    ).toBe(true);
    expect(admin.hasSession('student-1')).toBe(false);
  });

  it('fails when the user does not exist', async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      actorUserId: 'admin-1',
      userId: 'missing',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('User was not found.');
  });
});
