import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AdminUserManagementPort, AdminUserView } from '../ports/admin-user-management.port';

export interface UpdateAdminUserStatusRequest {
  readonly userId: string;
  readonly isActive: boolean;
}

export class UpdateAdminUserStatusUseCase
  implements
    UseCase<UpdateAdminUserStatusRequest, Result<AdminUserView, string>>
{
  constructor(
    private readonly adminUserManagement: AdminUserManagementPort,
  ) {}

  async execute(
    request: UpdateAdminUserStatusRequest,
  ): Promise<Result<AdminUserView, string>> {
    const user = await this.adminUserManagement.findById(request.userId);

    if (!user) {
      return Result.failure('User was not found.');
    }

    if (user.isSystem && !request.isActive) {
      return Result.failure('System users cannot be deactivated.');
    }

    const updatedUser = await this.adminUserManagement.updateUserStatus(
      request.userId,
      request.isActive,
    );

    if (!updatedUser) {
      return Result.failure('User was not found.');
    }

    return Result.success(updatedUser);
  }
}
