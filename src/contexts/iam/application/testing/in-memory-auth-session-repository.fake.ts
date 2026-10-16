import { AuthSession } from '../../domain/entities/auth-session.entity';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';

/** In-memory AuthSessionRepository for e2e tests. */
export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  private sessions: AuthSession[] = [];

  findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSession | null> {
    return Promise.resolve(
      this.sessions.find(
        (session) => session.refreshTokenHash === refreshTokenHash,
      ) ?? null,
    );
  }

  save(session: AuthSession): Promise<void> {
    if (!this.sessions.includes(session)) {
      this.sessions.push(session);
    }

    return Promise.resolve();
  }

  deleteByUserId(userId: string): Promise<void> {
    this.sessions = this.sessions.filter(
      (session) => session.userId !== userId,
    );

    return Promise.resolve();
  }
}
