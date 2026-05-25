import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AdminUserView, AdminUserManagementPort } from '../ports/admin-user-management.port';

export class GetAdminUserUseCase
  implements UseCase<string, Result<AdminUserView, string>>
{
  constructor(
    private readonly adminUserManagement: AdminUserManagementPort,
  ) {}

  async execute(userId: string): Promise<Result<AdminUserView, string>> {
    const user = await this.adminUserManagement.findById(userId);

    if (!user) {
      return Result.failure('User was not found.');
    }

    return Result.success(user);
  }
}
