import { UseCase } from '../../../../shared/application/use-case';
import { AdminUserListResult } from '../dto/admin-user-list.result';
import { AdminUserManagementPort } from '../ports/admin-user-management.port';

export interface ListAdminUsersRequest {
  readonly search?: string;
  readonly isActive?: boolean;
  readonly page: number;
  readonly limit: number;
}

export class ListAdminUsersUseCase
  implements UseCase<ListAdminUsersRequest, AdminUserListResult>
{
  constructor(
    private readonly adminUserManagement: AdminUserManagementPort,
  ) {}

  async execute(request: ListAdminUsersRequest): Promise<AdminUserListResult> {
    const result = await this.adminUserManagement.listUsers(
      {
        search: request.search,
        isActive: request.isActive,
      },
      request.page,
      request.limit,
    );

    return {
      items: result.items,
      page: request.page,
      limit: request.limit,
      totalItems: result.totalItems,
      totalPages: Math.max(1, Math.ceil(result.totalItems / request.limit)),
    };
  }
}
