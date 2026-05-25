import type { AdminUserManagementPort } from '../../../application/ports/admin-user-management.port';
import {
  ResetDomainResult,
  ResetExecutionContext,
  ResettableDomainHandler,
} from '../../../application/ports/resettable-domain-handler.port';

export class PrismaIamResetHandler implements ResettableDomainHandler {
  readonly domainName = 'iam';

  constructor(
    private readonly adminUserManagement: AdminUserManagementPort,
  ) {}

  async reset(context: ResetExecutionContext): Promise<ResetDomainResult> {
    if (context.scope === 'user' && context.targetUserId) {
      const clearedSessions = await this.adminUserManagement.clearAuthSessionsForUser(
        context.targetUserId,
      );
      const deletedUsers = await this.adminUserManagement.deleteNonSystemUserById(
        context.targetUserId,
      );

      return {
        domain: this.domainName,
        deletedRecords: clearedSessions + deletedUsers,
        preservedRecords: 0,
      };
    }

    const clearedSessions = await this.adminUserManagement.clearAllAuthSessions();
    const deletedUsers = await this.adminUserManagement.deleteNonSystemUsers();
    const preservedUsers = await this.adminUserManagement.countSystemUsers();

    return {
      domain: this.domainName,
      deletedRecords: clearedSessions + deletedUsers,
      preservedRecords: preservedUsers,
    };
  }
}
