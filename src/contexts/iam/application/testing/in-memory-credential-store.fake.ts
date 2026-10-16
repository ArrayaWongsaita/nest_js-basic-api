import { UserAccessProfile } from '../dto/user-access-profile';
import { UserAccessReader } from '../ports/user-access-reader.port';
import { UserCredentialsPort } from '../ports/user-credentials.port';

export interface FakeCredentialSeed {
  readonly userId: string;
  readonly email?: string;
  readonly passwordHash: string;
  readonly roles?: string[];
  readonly permissions?: string[];
  readonly mustChangePassword?: boolean;
  readonly isActive?: boolean;
}

/**
 * In-memory stand-in for the user access reader and the credentials port,
 * sharing one set of users so password writes are visible to later reads.
 */
export class InMemoryCredentialStore
  implements UserAccessReader, UserCredentialsPort
{
  private readonly users = new Map<string, UserAccessProfile>();

  constructor(seeds: readonly FakeCredentialSeed[]) {
    for (const seed of seeds) {
      this.users.set(seed.userId, {
        userId: seed.userId,
        email: seed.email ?? `${seed.userId}@example.com`,
        passwordHash: seed.passwordHash,
        isActive: seed.isActive ?? true,
        isSystem: false,
        mustChangePassword: seed.mustChangePassword ?? false,
        roles: seed.roles ?? ['student'],
        permissions: seed.permissions ?? [],
      });
    }
  }

  findByEmail(email: string): Promise<UserAccessProfile | null> {
    return Promise.resolve(
      [...this.users.values()].find((user) => user.email === email) ?? null,
    );
  }

  findById(userId: string): Promise<UserAccessProfile | null> {
    return Promise.resolve(this.users.get(userId) ?? null);
  }

  setPassword(
    userId: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ): Promise<boolean> {
    const user = this.users.get(userId);

    if (!user) {
      return Promise.resolve(false);
    }

    this.users.set(userId, { ...user, passwordHash, mustChangePassword });

    return Promise.resolve(true);
  }
}
