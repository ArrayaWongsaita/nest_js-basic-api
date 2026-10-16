import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import {
  AdminUserManagementPort,
  AdminUserView,
} from '../ports/admin-user-management.port';

export interface RestoreAdminUserRequest {
  readonly actorUserId: string;
  readonly userId: string;
}

export class RestoreAdminUserUseCase implements UseCase<
  RestoreAdminUserRequest,
  Result<AdminUserView, string>
> {
  constructor(private readonly adminUserManagement: AdminUserManagementPort) {}

  async execute(
    request: RestoreAdminUserRequest,
  ): Promise<Result<AdminUserView, string>> {
    const user = await this.adminUserManagement.findById(request.userId);

    if (!user) {
      return Result.failure('User was not found.');
    }

    if (!user.deletedAt) {
      return Result.failure('User is not deleted.');
    }

    const restoredUser = await this.adminUserManagement.restoreUser(
      request.userId,
    );

    if (!restoredUser) {
      return Result.failure('User was not found.');
    }

    await this.adminUserManagement.clearAuthSessionsForUser(request.userId);

    return Result.success(restoredUser);
  }
}
