import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AdminUserManagementPort } from '../ports/admin-user-management.port';
import { OpaqueTokenGenerator } from '../ports/opaque-token-generator.port';
import { PasswordHasher } from '../ports/password-hasher.port';
import { UserCredentialsPort } from '../ports/user-credentials.port';

export interface ResetAdminUserPasswordRequest {
  readonly actorUserId: string;
  readonly userId: string;
}

export interface ResetAdminUserPasswordResult {
  readonly userId: string;
  readonly temporaryPassword: string;
}

export class ResetAdminUserPasswordUseCase implements UseCase<
  ResetAdminUserPasswordRequest,
  Result<ResetAdminUserPasswordResult, string>
> {
  constructor(
    private readonly adminUserManagement: AdminUserManagementPort,
    private readonly credentials: UserCredentialsPort,
    private readonly passwordHasher: PasswordHasher,
    private readonly temporaryPasswordGenerator: OpaqueTokenGenerator,
  ) {}

  async execute(
    request: ResetAdminUserPasswordRequest,
  ): Promise<Result<ResetAdminUserPasswordResult, string>> {
    const user = await this.adminUserManagement.findById(request.userId);

    if (!user || user.deletedAt) {
      return Result.failure('User was not found.');
    }

    const temporaryPassword = await this.temporaryPasswordGenerator.generate();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);
    const updated = await this.credentials.setPassword(
      request.userId,
      passwordHash,
      true,
    );

    if (!updated) {
      return Result.failure('User was not found.');
    }

    await this.adminUserManagement.clearAuthSessionsForUser(request.userId);

    return Result.success({ userId: request.userId, temporaryPassword });
  }
}
