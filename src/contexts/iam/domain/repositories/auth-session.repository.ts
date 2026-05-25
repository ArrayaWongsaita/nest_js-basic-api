import { AuthSession } from '../entities/auth-session.entity';

export interface AuthSessionRepository {
  findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null>;
  save(session: AuthSession): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
