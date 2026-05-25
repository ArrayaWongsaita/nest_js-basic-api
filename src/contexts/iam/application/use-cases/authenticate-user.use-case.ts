import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { Clock } from '../../../../shared/application/clock.port';
import { AuthenticateUserCommand } from '../commands/authenticate-user.command';
import { AuthSessionResult } from '../dto/auth-session.result';
import { PasswordHasher } from '../ports/password-hasher.port';
import { AccessTokenIssuer } from '../ports/access-token-issuer.port';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator.port';
import { OpaqueTokenHasher } from '../ports/opaque-token-hasher.port';
import { UserAccessReader } from '../ports/user-access-reader.port';
import { AuthSession } from '../../domain/entities/auth-session.entity';
import { DEFAULT_ACCESS_TOKEN_TYPE } from '../values/auth.constants';

export class AuthenticateUserUseCase
  implements UseCase<AuthenticateUserCommand, Result<AuthenticatedUserResult, string>>
{
  constructor(
    private readonly userAccessReader: UserAccessReader,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenIssuer: AccessTokenIssuer,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly opaqueTokenGenerator: OpaqueTokenGenerator,
    private readonly opaqueTokenHasher: OpaqueTokenHasher,
    private readonly clock: Clock,
    private readonly refreshTokenTtlSeconds: number,
  ) {}

  async execute(
    command: AuthenticateUserCommand,
  ): Promise<Result<AuthenticatedUserResult, string>> {
    const user = await this.userAccessReader.findByEmail(command.email);

    if (!user) {
      return Result.failure('Invalid email or password.');
    }

    if (!user.isActive) {
      return Result.failure('User account is inactive.');
    }

    const passwordMatches = await this.passwordHasher.verify(
      command.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return Result.failure('Invalid email or password.');
    }

    return Result.success(await this.createAuthenticatedSession(user));
  }

  private async createAuthenticatedSession(user: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  }): Promise<AuthenticatedUserResult> {
    const refreshToken = await this.opaqueTokenGenerator.generate();
    const refreshTokenHash = await this.opaqueTokenHasher.hash(refreshToken);
    const now = this.clock.now();
    const expiresAt = new Date(
      now.getTime() + this.refreshTokenTtlSeconds * 1000,
    );
    const accessToken = await this.accessTokenIssuer.issue({
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    });
    const session = AuthSession.issue({
      userId: user.userId,
      refreshTokenHash,
      expiresAt,
      issuedAt: now,
    });

    await this.authSessionRepository.deleteByUserId(user.userId);
    await this.authSessionRepository.save(session);

    return {
      refreshToken,
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
    };
  }
}

export interface AuthenticatedUserResult {
  refreshToken: string;
  response: AuthSessionResult;
}
