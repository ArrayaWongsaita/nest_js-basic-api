import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { STUDENT_ROLE_NAME } from '../../domain/constants/role-name.constants';
import { PasswordPolicyService } from '../../domain/services/password-policy.service';
import { UserEmailAddress } from '../../domain/value-objects/user-email-address';
import { AdminUserManagementPort, AdminUserView } from '../ports/admin-user-management.port';
import { PasswordHasher } from '../ports/password-hasher.port';
import { RbacCatalogPort } from '../ports/rbac-catalog.port';

export interface CreateAdminUserRequest {
  readonly email: string;
  readonly password: string;
  readonly roleNames: readonly string[];
}

export class CreateAdminUserUseCase
  implements UseCase<CreateAdminUserRequest, Result<AdminUserView, string>>
{
  constructor(
    private readonly adminUserManagement: AdminUserManagementPort,
    private readonly rbacCatalog: RbacCatalogPort,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordPolicy: PasswordPolicyService,
  ) {}

  async execute(
    request: CreateAdminUserRequest,
  ): Promise<Result<AdminUserView, string>> {
    const email = UserEmailAddress.create(request.email).toString();
    const existingUser = await this.adminUserManagement.findByEmail(email);

    if (existingUser) {
      return Result.failure('User already exists.');
    }

    this.passwordPolicy.ensureSatisfied(request.password);

    const requestedRoleNames =
      request.roleNames.length > 0 ? request.roleNames : [STUDENT_ROLE_NAME];
    const roleValidationResult = await validateRoleNames(
      this.rbacCatalog,
      requestedRoleNames,
    );

    if (!roleValidationResult.ok) {
      return Result.failure(roleValidationResult.error);
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    return Result.success(
      await this.adminUserManagement.createUser({
        email,
        passwordHash,
        roleNames: roleValidationResult.value,
      }),
    );
  }
}

export async function validateRoleNames(
  rbacCatalog: RbacCatalogPort,
  roleNames: readonly string[],
): Promise<Result<string[], string>> {
  const normalizedRoleNames = roleNames.map((roleName) =>
    roleName.trim().toLowerCase(),
  );
  const uniqueRoleNames = [...new Set(normalizedRoleNames)];

  if (uniqueRoleNames.length === 0) {
    return Result.failure('At least one role must be assigned.');
  }

  for (const roleName of uniqueRoleNames) {
    const role = await rbacCatalog.findRoleByName(roleName);

    if (!role) {
      return Result.failure(`Role "${roleName}" was not found.`);
    }
  }

  return Result.success(uniqueRoleNames);
}
