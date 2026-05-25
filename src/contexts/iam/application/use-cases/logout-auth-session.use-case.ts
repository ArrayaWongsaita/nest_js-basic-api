import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { LogoutAuthSessionCommand } from '../commands/logout-auth-session.command';
import { OpaqueTokenHasher } from '../ports/opaque-token-hasher.port';

export class LogoutAuthSessionUseCase
  implements UseCase<LogoutAuthSessionCommand, void>
{
  constructor(
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly opaqueTokenHasher: OpaqueTokenHasher,
  ) {}

  async execute(
    command: LogoutAuthSessionCommand,
  ): Promise<void> {
    if (!command.refreshToken) {
      return;
    }

    const refreshTokenHash = await this.opaqueTokenHasher.hash(
      command.refreshToken,
    );
    const session = await this.authSessionRepository.findByRefreshTokenHash(
      refreshTokenHash,
    );

    if (session) {
      await this.authSessionRepository.deleteByUserId(session.userId);
    }
  }
}
