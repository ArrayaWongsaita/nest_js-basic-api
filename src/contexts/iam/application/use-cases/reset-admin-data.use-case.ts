import { ADMIN_ROLE_NAME } from '../../domain/constants/role-name.constants';
import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AdminDataResetResult } from '../dto/admin-data-reset.result';
import {
  ADMIN_MAINTENANCE_DISABLED_IN_PRODUCTION_MESSAGE,
  AdminMaintenancePolicy,
} from '../ports/admin-maintenance-policy.port';
import { AdminUserManagementPort } from '../ports/admin-user-management.port';
import {
  AdminResetScope,
  ResettableDomainHandler,
} from '../ports/resettable-domain-handler.port';
import { RbacCatalogPort } from '../ports/rbac-catalog.port';

export interface ResetAdminDataRequest {
  readonly actorUserId: string;
  readonly scope: AdminResetScope;
  readonly targetUserId: string | null;
  readonly domains: readonly string[];
  readonly mode: 'reset_to_demo_baseline';
  readonly reason?: string;
}

export class ResetAdminDataUseCase implements UseCase<
  ResetAdminDataRequest,
  Result<AdminDataResetResult, string>
> {
  constructor(
    private readonly handlers: readonly ResettableDomainHandler[],
    private readonly adminUserManagement: AdminUserManagementPort,
    private readonly rbacCatalog: RbacCatalogPort,
    private readonly maintenancePolicy: AdminMaintenancePolicy,
  ) {}

  async execute(
    request: ResetAdminDataRequest,
  ): Promise<Result<AdminDataResetResult, string>> {
    if (!this.maintenancePolicy.allowed) {
      return Result.failure(ADMIN_MAINTENANCE_DISABLED_IN_PRODUCTION_MESSAGE);
    }

    if (request.scope === 'user' && !request.targetUserId) {
      return Result.failure('targetUserId is required for user-scoped resets.');
    }

    const supportedDomains = this.handlers.map((handler) => handler.domainName);
    const resolvedDomains = resolveRequestedDomains(
      request.domains,
      supportedDomains,
    );

    if (!resolvedDomains.ok) {
      return Result.failure(resolvedDomains.error);
    }

    if (request.scope === 'user' && request.targetUserId) {
      const user = await this.adminUserManagement.findById(
        request.targetUserId,
      );

      if (!user) {
        return Result.failure('User was not found.');
      }

      if (user.isSystem && resolvedDomains.value.includes('iam')) {
        return Result.failure(
          'System users cannot be reset through IAM reset.',
        );
      }
    }

    if (resolvedDomains.value.includes('iam')) {
      const guard = await this.checkAdminSafety(request);

      if (guard) {
        return Result.failure(guard);
      }
    }

    const domainResults = [];

    for (const domainName of resolvedDomains.value) {
      const handler = this.handlers.find(
        (candidate) => candidate.domainName === domainName,
      );

      if (!handler) {
        return Result.failure(`Reset domain "${domainName}" is not supported.`);
      }

      domainResults.push(
        await handler.reset({
          scope: request.scope,
          targetUserId: request.targetUserId,
        }),
      );
    }

    const [roles, permissions, preservedUsers] = await Promise.all([
      this.rbacCatalog.listRoles(),
      this.rbacCatalog.listPermissions(),
      this.adminUserManagement.countSystemUsers(),
    ]);

    return Result.success({
      scope: request.scope,
      targetUserId: request.targetUserId,
      domains: resolvedDomains.value,
      mode: request.mode,
      reason: request.reason?.trim() || null,
      domainResults,
      preservedSystemRecords: {
        users: preservedUsers,
        roles: roles.filter((role) => role.isSystem).length,
        permissions: permissions.filter((permission) => permission.isSystem)
          .length,
      },
      completedAt: new Date(),
    });
  }

  /** The IAM reset deletes users: keep the acting admin and the last active admin. */
  private async checkAdminSafety(
    request: ResetAdminDataRequest,
  ): Promise<string | null> {
    if (request.scope === 'user' && request.targetUserId) {
      if (request.targetUserId === request.actorUserId) {
        return 'Admins cannot reset their own account.';
      }

      const target = await this.adminUserManagement.findById(
        request.targetUserId,
      );

      if (
        target &&
        target.isActive &&
        !target.deletedAt &&
        target.roles.some((role) => role.name === ADMIN_ROLE_NAME) &&
        (await this.adminUserManagement.countActiveAdmins()) <= 1
      ) {
        return 'The last active admin cannot be reset.';
      }

      return null;
    }

    const actor = await this.adminUserManagement.findById(request.actorUserId);

    if (!actor?.isSystem) {
      return 'A global IAM reset deletes all non-system users, including the acting admin; run it as a system admin.';
    }

    return null;
  }
}

function resolveRequestedDomains(
  domains: readonly string[],
  supportedDomains: readonly string[],
): Result<string[], string> {
  const normalizedDomains = domains.map((domain) =>
    domain.trim().toLowerCase(),
  );

  if (normalizedDomains.includes('all')) {
    return Result.success([...supportedDomains]);
  }

  const uniqueDomains = [...new Set(normalizedDomains)];

  if (uniqueDomains.length === 0) {
    return Result.failure('At least one reset domain must be selected.');
  }

  for (const domain of uniqueDomains) {
    if (!supportedDomains.includes(domain)) {
      return Result.failure(`Reset domain "${domain}" is not supported.`);
    }
  }

  return Result.success(uniqueDomains);
}
