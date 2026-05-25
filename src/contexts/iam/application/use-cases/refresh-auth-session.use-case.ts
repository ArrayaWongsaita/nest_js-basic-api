import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { Clock } from '../../../../shared/application/clock.port';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { RefreshAuthSessionCommand } from '../commands/refresh-auth-session.command';
import { AuthSessionResult } from '../dto/auth-session.result';
import { AccessTokenIssuer } from '../ports/access-token-issuer.port';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator.port';
import { OpaqueTokenHasher } from '../ports/opaque-token-hasher.port';
import { UserAccessReader } from '../ports/user-access-reader.port';
import { DEFAULT_ACCESS_TOKEN_TYPE } from '../values/auth.constants';

export class RefreshAuthSessionUseCase
  implements UseCase<RefreshAuthSessionCommand, Result<AuthenticatedRefreshResult, string>>
{
  constructor(
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly userAccessReader: UserAccessReader,
    private readonly accessTokenIssuer: AccessTokenIssuer,
    private readonly opaqueTokenGenerator: OpaqueTokenGenerator,
    private readonly opaqueTokenHasher: OpaqueTokenHasher,
    private readonly clock: Clock,
    private readonly refreshTokenTtlSeconds: number,
  ) {}

  async execute(
    command: RefreshAuthSessionCommand,
  ): Promise<Result<AuthenticatedRefreshResult, string>> {
    const providedRefreshTokenHash = await this.opaqueTokenHasher.hash(
      command.refreshToken,
    );
    const session = await this.authSessionRepository.findByRefreshTokenHash(
      providedRefreshTokenHash,
    );

    if (!session || session.isExpiredAt(this.clock.now())) {
      return Result.failure('Refresh session is invalid or expired.');
    }

    const user = await this.userAccessReader.findById(session.userId);

    if (!user) {
      return Result.failure('Refresh session is invalid or expired.');
    }

    if (!user.isActive) {
      return Result.failure('User account is inactive.');
    }

    const rotatedRefreshToken = await this.opaqueTokenGenerator.generate();
    const rotatedRefreshTokenHash = await this.opaqueTokenHasher.hash(
      rotatedRefreshToken,
    );
    const now = this.clock.now();
    const expiresAt = new Date(
      now.getTime() + this.refreshTokenTtlSeconds * 1000,
    );

    session.rotate(rotatedRefreshTokenHash, expiresAt, now);
    await this.authSessionRepository.save(session);

    const accessToken = await this.accessTokenIssuer.issue({
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    });

    return Result.success({
      refreshToken: rotatedRefreshToken,
      response: {
        accessToken: accessToken.token,
        tokenType: DEFAULT_ACCESS_TOKEN_TYPE,
        expiresInSeconds: accessToken.expiresInSeconds,
        user: {
          userId: user.userId,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
        },
      },
    });
  }
}

export interface AuthenticatedRefreshResult {
  refreshToken: string;
  response: AuthSessionResult;
}
