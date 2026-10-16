import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ADMIN_ROLE_NAME } from '../../domain/constants/role-name.constants';
import {
  AdminUserManagementPort,
  AdminUserView,
} from '../ports/admin-user-management.port';

export interface DeleteAdminUserRequest {
  readonly actorUserId: string;
  readonly userId: string;
}

export class DeleteAdminUserUseCase implements UseCase<
  DeleteAdminUserRequest,
  Result<AdminUserView, string>
> {
  constructor(private readonly adminUserManagement: AdminUserManagementPort) {}

  async execute(
    request: DeleteAdminUserRequest,
  ): Promise<Result<AdminUserView, string>> {
    const user = await this.adminUserManagement.findById(request.userId);

    if (!user) {
      return Result.failure('User was not found.');
    }

    if (user.deletedAt) {
      return Result.failure('User is already deleted.');
    }

    if (user.isSystem) {
      return Result.failure('System users cannot be deleted.');
    }

    if (request.actorUserId === request.userId) {
      return Result.failure('Admins cannot delete their own account.');
    }

    if (
      user.isActive &&
      user.roles.some((role) => role.name === ADMIN_ROLE_NAME) &&
      (await this.adminUserManagement.countActiveAdmins()) <= 1
    ) {
      return Result.failure('The last active admin cannot be deleted.');
    }

    const deletedUser = await this.adminUserManagement.softDeleteUser(
      request.userId,
    );

    if (!deletedUser) {
      return Result.failure('User was not found.');
    }

    await this.adminUserManagement.clearAuthSessionsForUser(request.userId);

    return Result.success(deletedUser);
  }
}
