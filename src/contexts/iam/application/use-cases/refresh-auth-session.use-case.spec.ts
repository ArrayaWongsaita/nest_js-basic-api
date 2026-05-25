import { Clock } from '../../../../shared/application/clock.port';
import { AuthSession } from '../../domain/entities/auth-session.entity';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { RefreshAuthSessionCommand } from '../commands/refresh-auth-session.command';
import { UserAccessProfile } from '../dto/user-access-profile';
import {
  AccessTokenClaims,
  AccessTokenIssuer,
  IssuedAccessToken,
} from '../ports/access-token-issuer.port';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator.port';
import { OpaqueTokenHasher } from '../ports/opaque-token-hasher.port';
import { UserAccessReader } from '../ports/user-access-reader.port';
import { RefreshAuthSessionUseCase } from './refresh-auth-session.use-case';

class FixedClock implements Clock {
  constructor(private readonly currentDate: Date) {}

  now(): Date {
    return this.currentDate;
  }
}

class InMemoryAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly session: AuthSession | null) {}

  savedSession: AuthSession | null = null;

  findByRefreshTokenHash(): Promise<AuthSession | null> {
    return Promise.resolve(this.session);
  }

  save(session: AuthSession): Promise<void> {
    this.savedSession = session;

    return Promise.resolve();
  }

  deleteByUserId(): Promise<void> {
    return Promise.resolve();
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

class StubAccessTokenIssuer implements AccessTokenIssuer {
  issue(): Promise<IssuedAccessToken> {
    return Promise.resolve({
      token: 'rotated-access-token',
      expiresInSeconds: 900,
    });
  }

  verify(): Promise<AccessTokenClaims> {
    throw new Error('verify is not used in this test');
  }
}

class StubOpaqueTokenGenerator implements OpaqueTokenGenerator {
  generate(): Promise<string> {
    return Promise.resolve('rotated-refresh-token');
  }
}

class StubOpaqueTokenHasher implements OpaqueTokenHasher {
  hash(token: string): Promise<string> {
    return Promise.resolve(`hashed:${token}`);
  }
}

describe('RefreshAuthSessionUseCase', () => {
  it('rotates the refresh session and returns a new access token', async () => {
    const session = AuthSession.issue({
      userId: 'user-1',
      refreshTokenHash: 'hashed:refresh-token',
      expiresAt: new Date('2026-06-01T10:00:00.000Z'),
      issuedAt: new Date('2026-05-20T10:00:00.000Z'),
    });
    const repository = new InMemoryAuthSessionRepository(session);
    const useCase = new RefreshAuthSessionUseCase(
      repository,
      new InMemoryUserAccessReader({
        userId: 'user-1',
        email: 'architect@example.com',
        passwordHash: 'hashed:strong-password-123',
        isActive: true,
        isSystem: false,
        roles: ['student'],
        permissions: ['todo.create_own', 'todo.read_own'],
      }),
      new StubAccessTokenIssuer(),
      new StubOpaqueTokenGenerator(),
      new StubOpaqueTokenHasher(),
      new FixedClock(new Date('2026-05-25T10:00:00.000Z')),
      60 * 60 * 24 * 30,
    );

    const result = await useCase.execute(
      new RefreshAuthSessionCommand('refresh-token'),
    );

    expect(result.ok).toBe(true);
    expect(result.value.refreshToken).toBe('rotated-refresh-token');
    expect(result.value.response.accessToken).toBe('rotated-access-token');
    expect(repository.savedSession?.refreshTokenHash).toBe(
      'hashed:rotated-refresh-token',
    );
  });

  it('rejects an expired refresh session', async () => {
    const session = AuthSession.issue({
      userId: 'user-1',
      refreshTokenHash: 'hashed:refresh-token',
      expiresAt: new Date('2026-05-20T10:00:00.000Z'),
      issuedAt: new Date('2026-05-19T10:00:00.000Z'),
    });
    const repository = new InMemoryAuthSessionRepository(session);
    const useCase = new RefreshAuthSessionUseCase(
      repository,
      new InMemoryUserAccessReader({
        userId: 'user-1',
        email: 'architect@example.com',
        passwordHash: 'hashed:strong-password-123',
        isActive: true,
        isSystem: false,
        roles: ['student'],
        permissions: ['todo.create_own', 'todo.read_own'],
      }),
      new StubAccessTokenIssuer(),
      new StubOpaqueTokenGenerator(),
      new StubOpaqueTokenHasher(),
      new FixedClock(new Date('2026-05-25T10:00:00.000Z')),
      60 * 60 * 24 * 30,
    );

    const result = await useCase.execute(
      new RefreshAuthSessionCommand('refresh-token'),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Refresh session is invalid or expired.');
  });
});
