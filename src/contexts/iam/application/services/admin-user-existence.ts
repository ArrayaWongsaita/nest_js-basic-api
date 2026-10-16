import { UserExistencePort } from '../../../../shared/application/user-existence.port';
import { AdminUserManagementPort } from '../ports/admin-user-management.port';

/** IAM's answer to the shared `UserExistencePort`. */
export class AdminUserExistence implements UserExistencePort {
  constructor(private readonly users: AdminUserManagementPort) {}

  async exists(userId: string): Promise<boolean> {
    return (await this.users.findById(userId)) !== null;
  }
}
