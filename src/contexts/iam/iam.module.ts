import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DbModule } from '../../shared/infrastructure/database';
import { CLOCK } from '../../shared/application/tokens';
import { SystemClock } from '../../shared/infrastructure/system-clock';
import { AccessTokenAuthGuard } from '../../shared/presentation/http/auth/access-token-auth.guard';
import {
  ADMIN_USER_MANAGEMENT,
  ACCESS_TOKEN_ISSUER,
  AUTHENTICATE_USER_USE_CASE,
  AUTH_SESSION_REPOSITORY,
  CREATE_ADMIN_USER_USE_CASE,
  CREATE_PERMISSION_USE_CASE,
  CREATE_ROLE_USE_CASE,
  DEMO_USER_SEEDER,
  DELETE_PERMISSION_USE_CASE,
  DELETE_ROLE_USE_CASE,
  GET_CURRENT_USER_USE_CASE,
  GET_ADMIN_USER_USE_CASE,
  LIST_ADMIN_USERS_USE_CASE,
  LIST_PERMISSIONS_USE_CASE,
  LIST_ROLES_USE_CASE,
  LOGOUT_AUTH_SESSION_USE_CASE,
  OPAQUE_TOKEN_GENERATOR,
  OPAQUE_TOKEN_HASHER,
  PASSWORD_HASHER,
  PASSWORD_POLICY,
  RBAC_CATALOG,
  RESET_ADMIN_DATA_USE_CASE,
  RESETTABLE_DOMAINS,
  REFRESH_AUTH_SESSION_USE_CASE,
  REGISTER_USER_USE_CASE,
  SEED_DEMO_USERS_USE_CASE,
  UPDATE_ADMIN_USER_ROLES_USE_CASE,
  UPDATE_ADMIN_USER_STATUS_USE_CASE,
  UPDATE_PERMISSION_USE_CASE,
  UPDATE_ROLE_USE_CASE,
  USER_ACCESS_READER,
  USER_REPOSITORY,
} from './application/tokens';
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user.use-case';
import { CreateAdminUserUseCase } from './application/use-cases/create-admin-user.use-case';
import { CreatePermissionUseCase } from './application/use-cases/create-permission.use-case';
import { CreateRoleUseCase } from './application/use-cases/create-role.use-case';
import { DeletePermissionUseCase } from './application/use-cases/delete-permission.use-case';
import { DeleteRoleUseCase } from './application/use-cases/delete-role.use-case';
import { GetAdminUserUseCase } from './application/use-cases/get-admin-user.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { ListAdminUsersUseCase } from './application/use-cases/list-admin-users.use-case';
import { ListPermissionsUseCase } from './application/use-cases/list-permissions.use-case';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { LogoutAuthSessionUseCase } from './application/use-cases/logout-auth-session.use-case';
import { RefreshAuthSessionUseCase } from './application/use-cases/refresh-auth-session.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { ResetAdminDataUseCase } from './application/use-cases/reset-admin-data.use-case';
import { SeedDemoUsersUseCase } from './application/use-cases/seed-demo-users.use-case';
import { UpdateAdminUserRolesUseCase } from './application/use-cases/update-admin-user-roles.use-case';
import { UpdateAdminUserStatusUseCase } from './application/use-cases/update-admin-user-status.use-case';
import { UpdatePermissionUseCase } from './application/use-cases/update-permission.use-case';
import { UpdateRoleUseCase } from './application/use-cases/update-role.use-case';
import { PasswordPolicyService } from './domain/services/password-policy.service';
import { PrismaIamAdminGateway } from './infrastructure/persistence/prisma/prisma-iam-admin.gateway';
import { PrismaAuthSessionRepository } from './infrastructure/persistence/prisma/prisma-auth-session.repository';
import { PrismaDemoUserSeedGateway } from './infrastructure/persistence/prisma/prisma-demo-user-seed.gateway';
import { PrismaIamResetHandler } from './infrastructure/persistence/prisma/prisma-iam-reset.handler';
import { PrismaUserAccessReader } from './infrastructure/persistence/prisma/prisma-user-access.reader';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/prisma-user.repository';
import { CryptoOpaqueTokenGenerator } from './infrastructure/providers/crypto-opaque-token-generator';
import { JwtAccessTokenIssuer } from './infrastructure/providers/jwt-access-token-issuer';
import { Sha256OpaqueTokenHasher } from './infrastructure/providers/sha256-opaque-token-hasher';
import { ScryptPasswordHasher } from './infrastructure/providers/scrypt-password-hasher';
import { AdminDataResetsController } from './presentation/http/controllers/admin-data-resets.controller';
import { AdminDemoUserSeedsController } from './presentation/http/controllers/admin-demo-user-seeds.controller';
import { AdminPermissionsController } from './presentation/http/controllers/admin-permissions.controller';
import { AdminRolesController } from './presentation/http/controllers/admin-roles.controller';
import { AdminUsersController } from './presentation/http/controllers/admin-users.controller';
import { AuthController } from './presentation/http/controllers/auth.controller';
import { UsersController } from './presentation/http/controllers/users.controller';
import { APP_CONFIG, AppConfig } from '../../bootstrap/config/app-config';
import { PrismaTodoResetHandler } from '../todo/infrastructure/persistence/prisma/prisma-todo-reset.handler';

@Module({
  imports: [DbModule],
  controllers: [
    AuthController,
    UsersController,
    AdminUsersController,
    AdminRolesController,
    AdminPermissionsController,
    AdminDataResetsController,
    AdminDemoUserSeedsController,
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: ADMIN_USER_MANAGEMENT,
      useClass: PrismaIamAdminGateway,
    },
    {
      provide: RBAC_CATALOG,
      useExisting: ADMIN_USER_MANAGEMENT,
    },
    {
      provide: DEMO_USER_SEEDER,
      useClass: PrismaDemoUserSeedGateway,
    },
    {
      provide: USER_ACCESS_READER,
      useClass: PrismaUserAccessReader,
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: PrismaAuthSessionRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useFactory: () => new ScryptPasswordHasher(),
    },
    {
      provide: PASSWORD_POLICY,
      useFactory: () => new PasswordPolicyService(),
    },
    {
      provide: OPAQUE_TOKEN_GENERATOR,
      useFactory: () => new CryptoOpaqueTokenGenerator(),
    },
    {
      provide: OPAQUE_TOKEN_HASHER,
      useFactory: () => new Sha256OpaqueTokenHasher(),
    },
    {
      provide: ACCESS_TOKEN_ISSUER,
      useFactory: (appConfig: AppConfig) =>
        new JwtAccessTokenIssuer(
          appConfig.auth.accessTokenSecret,
          appConfig.auth.accessTokenTtlSeconds,
        ),
      inject: [APP_CONFIG],
    },
    {
      provide: CLOCK,
      useFactory: () => new SystemClock(),
    },
    {
      provide: REGISTER_USER_USE_CASE,
      useFactory: (
        userRepository: PrismaUserRepository,
        passwordHasher: ScryptPasswordHasher,
        passwordPolicy: PasswordPolicyService,
      ) =>
        new RegisterUserUseCase(userRepository, passwordHasher, passwordPolicy),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, PASSWORD_POLICY],
    },
    {
      provide: AUTHENTICATE_USER_USE_CASE,
      useFactory: (
        userAccessReader: PrismaUserAccessReader,
        passwordHasher: ScryptPasswordHasher,
        accessTokenIssuer: JwtAccessTokenIssuer,
        authSessionRepository: PrismaAuthSessionRepository,
        opaqueTokenGenerator: CryptoOpaqueTokenGenerator,
        opaqueTokenHasher: Sha256OpaqueTokenHasher,
        clock: SystemClock,
        appConfig: AppConfig,
      ) =>
        new AuthenticateUserUseCase(
          userAccessReader,
          passwordHasher,
          accessTokenIssuer,
          authSessionRepository,
          opaqueTokenGenerator,
          opaqueTokenHasher,
          clock,
          appConfig.auth.refreshTokenTtlSeconds,
        ),
      inject: [
        USER_ACCESS_READER,
        PASSWORD_HASHER,
        ACCESS_TOKEN_ISSUER,
        AUTH_SESSION_REPOSITORY,
        OPAQUE_TOKEN_GENERATOR,
        OPAQUE_TOKEN_HASHER,
        CLOCK,
        APP_CONFIG,
      ],
    },
    {
      provide: REFRESH_AUTH_SESSION_USE_CASE,
      useFactory: (
        authSessionRepository: PrismaAuthSessionRepository,
        userAccessReader: PrismaUserAccessReader,
        accessTokenIssuer: JwtAccessTokenIssuer,
        opaqueTokenGenerator: CryptoOpaqueTokenGenerator,
        opaqueTokenHasher: Sha256OpaqueTokenHasher,
        clock: SystemClock,
        appConfig: AppConfig,
      ) =>
        new RefreshAuthSessionUseCase(
          authSessionRepository,
          userAccessReader,
          accessTokenIssuer,
          opaqueTokenGenerator,
          opaqueTokenHasher,
          clock,
          appConfig.auth.refreshTokenTtlSeconds,
        ),
      inject: [
        AUTH_SESSION_REPOSITORY,
        USER_ACCESS_READER,
        ACCESS_TOKEN_ISSUER,
        OPAQUE_TOKEN_GENERATOR,
        OPAQUE_TOKEN_HASHER,
        CLOCK,
        APP_CONFIG,
      ],
    },
    {
      provide: LOGOUT_AUTH_SESSION_USE_CASE,
      useFactory: (
        authSessionRepository: PrismaAuthSessionRepository,
        opaqueTokenHasher: Sha256OpaqueTokenHasher,
      ) =>
        new LogoutAuthSessionUseCase(
          authSessionRepository,
          opaqueTokenHasher,
        ),
      inject: [AUTH_SESSION_REPOSITORY, OPAQUE_TOKEN_HASHER],
    },
    {
      provide: GET_CURRENT_USER_USE_CASE,
      useFactory: (userAccessReader: PrismaUserAccessReader) =>
        new GetCurrentUserUseCase(userAccessReader),
      inject: [USER_ACCESS_READER],
    },
    {
      provide: LIST_ADMIN_USERS_USE_CASE,
      useFactory: (adminUserManagement: PrismaIamAdminGateway) =>
        new ListAdminUsersUseCase(adminUserManagement),
      inject: [ADMIN_USER_MANAGEMENT],
    },
    {
      provide: GET_ADMIN_USER_USE_CASE,
      useFactory: (adminUserManagement: PrismaIamAdminGateway) =>
        new GetAdminUserUseCase(adminUserManagement),
      inject: [ADMIN_USER_MANAGEMENT],
    },
    {
      provide: CREATE_ADMIN_USER_USE_CASE,
      useFactory: (
        adminUserManagement: PrismaIamAdminGateway,
        rbacCatalog: PrismaIamAdminGateway,
        passwordHasher: ScryptPasswordHasher,
        passwordPolicy: PasswordPolicyService,
      ) =>
        new CreateAdminUserUseCase(
          adminUserManagement,
          rbacCatalog,
          passwordHasher,
          passwordPolicy,
        ),
      inject: [
        ADMIN_USER_MANAGEMENT,
        RBAC_CATALOG,
        PASSWORD_HASHER,
        PASSWORD_POLICY,
      ],
    },
    {
      provide: UPDATE_ADMIN_USER_ROLES_USE_CASE,
      useFactory: (
        adminUserManagement: PrismaIamAdminGateway,
        rbacCatalog: PrismaIamAdminGateway,
      ) => new UpdateAdminUserRolesUseCase(adminUserManagement, rbacCatalog),
      inject: [ADMIN_USER_MANAGEMENT, RBAC_CATALOG],
    },
    {
      provide: UPDATE_ADMIN_USER_STATUS_USE_CASE,
      useFactory: (adminUserManagement: PrismaIamAdminGateway) =>
        new UpdateAdminUserStatusUseCase(adminUserManagement),
      inject: [ADMIN_USER_MANAGEMENT],
    },
    {
      provide: LIST_ROLES_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new ListRolesUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    {
      provide: CREATE_ROLE_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new CreateRoleUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    {
      provide: UPDATE_ROLE_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new UpdateRoleUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    {
      provide: DELETE_ROLE_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new DeleteRoleUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    {
      provide: LIST_PERMISSIONS_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new ListPermissionsUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    {
      provide: CREATE_PERMISSION_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new CreatePermissionUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    {
      provide: UPDATE_PERMISSION_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new UpdatePermissionUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    {
      provide: DELETE_PERMISSION_USE_CASE,
      useFactory: (rbacCatalog: PrismaIamAdminGateway) =>
        new DeletePermissionUseCase(rbacCatalog),
      inject: [RBAC_CATALOG],
    },
    PrismaTodoResetHandler,
    {
      provide: RESETTABLE_DOMAINS,
      useFactory: (
        adminUserManagement: PrismaIamAdminGateway,
        todoResetHandler: PrismaTodoResetHandler,
      ) => [todoResetHandler, new PrismaIamResetHandler(adminUserManagement)],
      inject: [ADMIN_USER_MANAGEMENT, PrismaTodoResetHandler],
    },
    {
      provide: RESET_ADMIN_DATA_USE_CASE,
      useFactory: (
        handlers: readonly [PrismaIamResetHandler | PrismaTodoResetHandler],
        adminUserManagement: PrismaIamAdminGateway,
        rbacCatalog: PrismaIamAdminGateway,
      ) =>
        new ResetAdminDataUseCase(handlers, adminUserManagement, rbacCatalog),
      inject: [RESETTABLE_DOMAINS, ADMIN_USER_MANAGEMENT, RBAC_CATALOG],
    },
    {
      provide: SEED_DEMO_USERS_USE_CASE,
      useFactory: (demoUserSeeder: PrismaDemoUserSeedGateway) =>
        new SeedDemoUsersUseCase(demoUserSeeder),
      inject: [DEMO_USER_SEEDER],
    },
    {
      provide: APP_GUARD,
      useClass: AccessTokenAuthGuard,
    },
  ],
  exports: [
    ACCESS_TOKEN_ISSUER,
    REGISTER_USER_USE_CASE,
    USER_REPOSITORY,
    USER_ACCESS_READER,
  ],
})
export class IamModule {}
