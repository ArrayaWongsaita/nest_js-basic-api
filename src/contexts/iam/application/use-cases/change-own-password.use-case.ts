import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AuthSessionRepository } from '../../domain/repositories/auth-session.repository';
import { PasswordPolicyService } from '../../domain/services/password-policy.service';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserAccessReader } from '../ports/user-access-reader.port';
import { UserCredentialsPort } from '../ports/user-credentials.port';

export interface ChangeOwnPasswordRequest {
  readonly userId: string;
  readonly currentPassword: string;
  readonly newPassword: string;
}

export class ChangeOwnPasswordUseCase implements UseCase<
  ChangeOwnPasswordRequest,
  Result<void, string>
> {
  constructor(
    private readonly userAccessReader: UserAccessReader,
    private readonly credentials: UserCredentialsPort,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordPolicy: PasswordPolicyService,
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async execute(
    request: ChangeOwnPasswordRequest,
  ): Promise<Result<void, string>> {
    const user = await this.userAccessReader.findById(request.userId);

    if (!user || !user.isActive) {
      return Result.failure('User was not found.');
    }

    const currentMatches = await this.passwordHasher.verify(
      request.currentPassword,
      user.passwordHash,
    );

    if (!currentMatches) {
      return Result.failure('Current password is incorrect.');
    }

    try {
      this.passwordPolicy.ensureSatisfied(request.newPassword);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error.message : 'Password is not acceptable.',
      );
    }

    if (request.newPassword === request.currentPassword) {
      return Result.failure(
        'New password must differ from the current password.',
      );
    }

    const passwordHash = await this.passwordHasher.hash(request.newPassword);
    await this.credentials.setPassword(request.userId, passwordHash, false);
    await this.authSessionRepository.deleteByUserId(request.userId);

    return Result.success(undefined);
  }
}
