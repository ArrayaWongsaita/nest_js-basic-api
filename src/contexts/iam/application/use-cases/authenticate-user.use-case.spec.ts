import { Clock } from '../../../../shared/application/clock.port';
import { Result } from '../../../../shared/application/result';
import { AuthSession } from '../../domain/entities/auth-session.entity';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { AuthenticateUserCommand } from '../commands/authenticate-user.command';
import { UserAccessProfile } from '../dto/user-access-profile';
import {
  AccessTokenClaims,
  AccessTokenIssuer,
  IssuedAccessToken,
} from '../ports/access-token-issuer.port';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator.port';
import { OpaqueTokenHasher } from '../ports/opaque-token-hasher.port';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserAccessReader } from '../ports/user-access-reader.port';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';

class FixedClock implements Clock {
  constructor(private readonly currentDate: Date) {}

  now(): Date {
    return this.currentDate;
  }
}

class InMemoryUserAccessReader implements UserAccessReader {
  constructor(private readonly user: UserAccessProfile | null) {}

  findByEmail(): Promise<UserAccessProfile | null> {
    return Promise.resolve(this.user);
  }

  findById(): Promise<UserAccessProfile | null> {
    return Promise.resolve(this.user);
  }
}

class TestPasswordHasher implements PasswordHasher {
  hash(rawPassword: string): Promise<string> {
    return Promise.resolve(`hashed:${rawPassword}`);
  }

  verify(rawPassword: string, hashedPassword: string): Promise<boolean> {
    return Promise.resolve(hashedPassword === `hashed:${rawPassword}`);
  }
}

class StubAccessTokenIssuer implements AccessTokenIssuer {
  issue(): Promise<IssuedAccessToken> {
    return Promise.resolve({
      token: 'access-token',
      expiresInSeconds: 900,
    });
  }

  verify(): Promise<AccessTokenClaims> {
    throw new Error('verify is not used in this test');
  }
}

class StubOpaqueTokenGenerator implements OpaqueTokenGenerator {
  generate(): Promise<string> {
    return Promise.resolve('refresh-token');
  }
}

class StubOpaqueTokenHasher implements OpaqueTokenHasher {
  hash(token: string): Promise<string> {
    return Promise.resolve(`hashed:${token}`);
  }
}

class InMemoryAuthSessionRepository implements AuthSessionRepository {
  savedSession: AuthSession | null = null;
  deletedUserId: string | null = null;

  findByRefreshTokenHash(): Promise<AuthSession | null> {
    return Promise.resolve(null);
  }

  save(session: AuthSession): Promise<void> {
    this.savedSession = session;

    return Promise.resolve();
  }

  deleteByUserId(userId: string): Promise<void> {
    this.deletedUserId = userId;

    return Promise.resolve();
  }
}

describe('AuthenticateUserUseCase', () => {
  it('creates an authenticated session for valid credentials', async () => {
    const sessionRepository = new InMemoryAuthSessionRepository();
    const useCase = new AuthenticateUserUseCase(
      new InMemoryUserAccessReader({
        userId: 'user-1',
        email: 'architect@example.com',
        passwordHash: 'hashed:strong-password-123',
        isActive: true,
        isSystem: false,
        roles: ['student'],
        permissions: ['todo.create_own', 'todo.read_own'],
      }),
      new TestPasswordHasher(),
      new StubAccessTokenIssuer(),
      sessionRepository,
      new StubOpaqueTokenGenerator(),
      new StubOpaqueTokenHasher(),
      new FixedClock(new Date('2026-05-25T10:00:00.000Z')),
      60 * 60 * 24 * 30,
    );

    const result = await useCase.execute(
      new AuthenticateUserCommand(
        'architect@example.com',
        'strong-password-123',
      ),
    );

    expect(result).toBeInstanceOf(Result);
    expect(result.ok).toBe(true);
    expect(result.value.refreshToken).toBe('refresh-token');
    expect(result.value.response.accessToken).toBe('access-token');
    expect(result.value.response.user.roles).toEqual(['student']);
    expect(sessionRepository.deletedUserId).toBe('user-1');
    expect(sessionRepository.savedSession?.refreshTokenHash).toBe(
      'hashed:refresh-token',
    );
  });

  it('rejects invalid credentials', async () => {
    const sessionRepository = new InMemoryAuthSessionRepository();
    const useCase = new AuthenticateUserUseCase(
      new InMemoryUserAccessReader({
        userId: 'user-1',
        email: 'architect@example.com',
        passwordHash: 'hashed:strong-password-123',
        isActive: true,
        isSystem: false,
        roles: ['student'],
        permissions: ['todo.create_own', 'todo.read_own'],
      }),
      new TestPasswordHasher(),
      new StubAccessTokenIssuer(),
      sessionRepository,
      new StubOpaqueTokenGenerator(),
      new StubOpaqueTokenHasher(),
      new FixedClock(new Date('2026-05-25T10:00:00.000Z')),
      60 * 60 * 24 * 30,
    );

    const result = await useCase.execute(
      new AuthenticateUserCommand('architect@example.com', 'wrong-password'),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid email or password.');
    expect(sessionRepository.savedSession).toBeNull();
  });

  it('rejects inactive users', async () => {
    const sessionRepository = new InMemoryAuthSessionRepository();
    const useCase = new AuthenticateUserUseCase(
      new InMemoryUserAccessReader({
        userId: 'user-1',
        email: 'architect@example.com',
        passwordHash: 'hashed:strong-password-123',
        isActive: false,
        isSystem: false,
        roles: ['student'],
        permissions: ['todo.create_own', 'todo.read_own'],
      }),
      new TestPasswordHasher(),
      new StubAccessTokenIssuer(),
      sessionRepository,
      new StubOpaqueTokenGenerator(),
      new StubOpaqueTokenHasher(),
      new FixedClock(new Date('2026-05-25T10:00:00.000Z')),
      60 * 60 * 24 * 30,
    );

    const result = await useCase.execute(
      new AuthenticateUserCommand(
        'architect@example.com',
        'strong-password-123',
      ),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe('User account is inactive.');
    expect(sessionRepository.savedSession).toBeNull();
  });
});
