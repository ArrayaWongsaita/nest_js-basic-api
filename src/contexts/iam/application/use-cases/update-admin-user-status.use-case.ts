import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import {
  AdminUserManagementPort,
  AdminUserView,
} from '../ports/admin-user-management.port';

import { ADMIN_ROLE_NAME } from '../../domain/constants/role-name.constants';

export interface UpdateAdminUserStatusRequest {
  readonly actorUserId: string;
  readonly userId: string;
  readonly isActive: boolean;
}

export class UpdateAdminUserStatusUseCase implements UseCase<
  UpdateAdminUserStatusRequest,
  Result<AdminUserView, string>
> {
  constructor(private readonly adminUserManagement: AdminUserManagementPort) {}

  async execute(
    request: UpdateAdminUserStatusRequest,
  ): Promise<Result<AdminUserView, string>> {
    const user = await this.adminUserManagement.findById(request.userId);

    if (!user) {
      return Result.failure('User was not found.');
    }

    if (!request.isActive) {
      if (user.isSystem) {
        return Result.failure('System users cannot be deactivated.');
      }

      if (request.actorUserId === request.userId) {
        return Result.failure('Admins cannot deactivate their own account.');
      }

      if (
        user.isActive &&
        user.roles.some((role) => role.name === ADMIN_ROLE_NAME) &&
        (await this.adminUserManagement.countActiveAdmins()) <= 1
      ) {
        return Result.failure('The last active admin cannot be deactivated.');
      }
    }

    const updatedUser = await this.adminUserManagement.updateUserStatus(
      request.userId,
      request.isActive,
    );

    if (!updatedUser) {
      return Result.failure('User was not found.');
    }

    if (!request.isActive) {
      await this.adminUserManagement.clearAuthSessionsForUser(request.userId);
    }

    return Result.success(updatedUser);
  }
}
