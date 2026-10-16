import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiConflictErrorResponse,
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import {
  ApiCreateEndpointDocs,
  ApiListEndpointDocs,
  ApiReadEndpointDocs,
  ApiUpdateEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import {
  CREATE_ADMIN_USER_USE_CASE,
  GET_ADMIN_USER_USE_CASE,
  RESET_ADMIN_USER_PASSWORD_USE_CASE,
  LIST_ADMIN_USERS_USE_CASE,
  UPDATE_ADMIN_USER_ROLES_USE_CASE,
  UPDATE_ADMIN_USER_STATUS_USE_CASE,
  DELETE_ADMIN_USER_USE_CASE,
  RESTORE_ADMIN_USER_USE_CASE,
} from '../../../application/tokens';
import { CreateAdminUserUseCase } from '../../../application/use-cases/create-admin-user.use-case';
import { GetAdminUserUseCase } from '../../../application/use-cases/get-admin-user.use-case';
import { ListAdminUsersUseCase } from '../../../application/use-cases/list-admin-users.use-case';
import type {
  AuditedResetUserPassword,
  AuditedDeleteUser,
  AuditedRestoreUser,
  AuditedUpdateUserRoles,
  AuditedUpdateUserStatus,
} from '../../../application/audit/admin-audit-descriptors';
import {
  IAM_USERS_CREATE_PERMISSION,
  IAM_USERS_DEACTIVATE_PERMISSION,
  IAM_USERS_DELETE_PERMISSION,
  IAM_USERS_RESTORE_PERMISSION,
  IAM_USERS_READ_PERMISSION,
  IAM_USERS_RESET_PASSWORD_PERMISSION,
  IAM_USERS_UPDATE_ROLES_PERMISSION,
} from '../../../domain/constants/permission-name.constants';
import { CurrentUser } from '../../../../../shared/presentation/http/auth/current-user.decorator';
import type { AuthenticatedUserContext } from '../../../../../shared/presentation/http/auth/authenticated-user.context';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import {
  AdminUserHttpResponseDto,
  AdminUserPasswordResetHttpResponseDto,
  AdminUserResponseDto,
  AdminUserRouteParamsDto,
  AdminUsersHttpResponseDto,
  CreateAdminUserBodyDto,
  ListAdminUsersQueryDto,
  UpdateAdminUserRolesBodyDto,
  UpdateAdminUserStatusBodyDto,
} from '../dto/admin-users.dto';
import { AdminPresenter } from '../presenters/admin.presenter';

@ApiTags('Admin Users')
@ApiBearerAuth('access-token')
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    @Inject(LIST_ADMIN_USERS_USE_CASE)
    private readonly listAdminUsersUseCase: ListAdminUsersUseCase,
    @Inject(GET_ADMIN_USER_USE_CASE)
    private readonly getAdminUserUseCase: GetAdminUserUseCase,
    @Inject(CREATE_ADMIN_USER_USE_CASE)
    private readonly createAdminUserUseCase: CreateAdminUserUseCase,
    @Inject(UPDATE_ADMIN_USER_ROLES_USE_CASE)
    private readonly updateAdminUserRolesUseCase: AuditedUpdateUserRoles,
    @Inject(UPDATE_ADMIN_USER_STATUS_USE_CASE)
    private readonly updateAdminUserStatusUseCase: AuditedUpdateUserStatus,
    @Inject(RESET_ADMIN_USER_PASSWORD_USE_CASE)
    private readonly resetAdminUserPasswordUseCase: AuditedResetUserPassword,
    @Inject(DELETE_ADMIN_USER_USE_CASE)
    private readonly deleteAdminUserUseCase: AuditedDeleteUser,
    @Inject(RESTORE_ADMIN_USER_USE_CASE)
    private readonly restoreAdminUserUseCase: AuditedRestoreUser,
  ) {}

  @Get()
  @RequirePermissions(IAM_USERS_READ_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List IAM users for system administration',
    description: 'Returns a paginated list of IAM users for admin workflows.',
    badRequestDescription: 'The request query parameters failed validation.',
    successDescription: 'The IAM users were returned successfully.',
    responseType: AdminUsersHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.read.',
  )
  async listUsers(
    @Query() query: ListAdminUsersQueryDto,
  ): Promise<
    HttpSuccessResponse<
      AdminUserResponseDto[],
      { page: number; limit: number; totalItems: number; totalPages: number }
    >
  > {
    const result = await this.listAdminUsersUseCase.execute(query);

    return createSuccessResponse(
      AdminPresenter.toUserListResponse(result),
      AdminPresenter.toUserListMeta(result),
    );
  }

  @Get(':userId')
  @RequirePermissions(IAM_USERS_READ_PERMISSION)
  @ApiReadEndpointDocs({
    summary: 'Read one IAM user for system administration',
    description: 'Returns one IAM user by identifier for admin workflows.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The IAM user was returned successfully.',
    responseType: AdminUserHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.read.',
  )
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async getUser(
    @Param() params: AdminUserRouteParamsDto,
  ): Promise<HttpSuccessResponse<AdminUserResponseDto>> {
    const result = await this.getAdminUserUseCase.execute(params.userId);

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toUserResponse(result.value));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(IAM_USERS_CREATE_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create an IAM user from the admin surface',
    description:
      'Creates a new IAM user with optional role assignments for system administration.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The IAM user was created successfully.',
    responseType: AdminUserHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse(
        'The email or role assignment conflicts with existing records.',
      ),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.create.',
  )
  async createUser(
    @Body() body: CreateAdminUserBodyDto,
  ): Promise<HttpSuccessResponse<AdminUserResponseDto>> {
    const result = await this.createAdminUserUseCase.execute(body);

    if (!result.ok) {
      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toUserResponse(result.value));
  }

  @Patch(':userId/roles')
  @RequirePermissions(IAM_USERS_UPDATE_ROLES_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Replace role assignments for one IAM user',
    description: 'Replaces the full role assignment set for one IAM user.',
    badRequestDescription:
      'The route parameters or request payload failed validation.',
    successDescription: 'The IAM user roles were updated successfully.',
    responseType: AdminUserHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse(
        'The user role update conflicts with role constraints or missing roles.',
      ),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.update_roles.',
  )
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async updateUserRoles(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param() params: AdminUserRouteParamsDto,
    @Body() body: UpdateAdminUserRolesBodyDto,
  ): Promise<HttpSuccessResponse<AdminUserResponseDto>> {
    const result = await this.updateAdminUserRolesUseCase.execute(currentUser.userId, {
      actorUserId: currentUser.userId,
      userId: params.userId,
      roleNames: body.roleNames,
    });

    if (!result.ok) {
      if (result.error === 'User was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toUserResponse(result.value));
  }

  @Patch(':userId/status')
  @RequirePermissions(IAM_USERS_DEACTIVATE_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update the active status of one IAM user',
    description:
      'Activates or deactivates one IAM user without deleting the record.',
    badRequestDescription:
      'The route parameters or request payload failed validation.',
    successDescription: 'The IAM user status was updated successfully.',
    responseType: AdminUserHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse(
        'The user status update conflicts with protected system-user rules.',
      ),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.deactivate.',
  )
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async updateUserStatus(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param() params: AdminUserRouteParamsDto,
    @Body() body: UpdateAdminUserStatusBodyDto,
  ): Promise<HttpSuccessResponse<AdminUserResponseDto>> {
    const result = await this.updateAdminUserStatusUseCase.execute(currentUser.userId, {
      actorUserId: currentUser.userId,
      userId: params.userId,
      isActive: body.isActive,
    });

    if (!result.ok) {
      if (result.error === 'User was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toUserResponse(result.value));
  }

  @Delete(':userId')
  @RequirePermissions(IAM_USERS_DELETE_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Soft-delete one IAM user',
    description:
      'Marks the user as deleted: they can no longer sign in, are hidden from the default list and lose their session. Data is retained and the action can be reversed with restore.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The IAM user was soft-deleted successfully.',
    responseType: AdminUserHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse(
        'The deletion violates an admin safety rule (self, system user, last active admin) or the user is already deleted.',
      ),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.delete.',
  )
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async deleteUser(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param() params: AdminUserRouteParamsDto,
  ): Promise<HttpSuccessResponse<AdminUserResponseDto>> {
    const result = await this.deleteAdminUserUseCase.execute(
      currentUser.userId,
      { actorUserId: currentUser.userId, userId: params.userId },
    );

    if (!result.ok) {
      if (result.error === 'User was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toUserResponse(result.value));
  }

  @Post(':userId/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(IAM_USERS_RESTORE_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Restore one soft-deleted IAM user',
    description: 'Clears the deleted marker so the user can sign in again.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The IAM user was restored successfully.',
    responseType: AdminUserHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse('The user is not deleted.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.restore.',
  )
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async restoreUser(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param() params: AdminUserRouteParamsDto,
  ): Promise<HttpSuccessResponse<AdminUserResponseDto>> {
    const result = await this.restoreAdminUserUseCase.execute(
      currentUser.userId,
      { actorUserId: currentUser.userId, userId: params.userId },
    );

    if (!result.ok) {
      if (result.error === 'User was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toUserResponse(result.value));
  }

  @Post(':userId/password-reset')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(IAM_USERS_RESET_PASSWORD_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Reset the password of one IAM user',
    description:
      'Generates a temporary password, returns it once, ends the user session and forces a password change at next sign-in.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The password was reset and the temporary password returned.',
    responseType: AdminUserPasswordResetHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.users.reset_password.',
  )
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async resetUserPassword(
    @CurrentUser() currentUser: AuthenticatedUserContext,
    @Param() params: AdminUserRouteParamsDto,
  ): Promise<
    HttpSuccessResponse<{ userId: string; temporaryPassword: string }>
  > {
    const result = await this.resetAdminUserPasswordUseCase.execute(
      currentUser.userId,
      { actorUserId: currentUser.userId, userId: params.userId },
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse({
      userId: result.value.userId,
      temporaryPassword: result.value.temporaryPassword,
    });
  }
}
