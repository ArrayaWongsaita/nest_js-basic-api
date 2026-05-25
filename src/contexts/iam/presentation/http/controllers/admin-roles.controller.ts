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
  ApiDeleteEndpointDocs,
  ApiListEndpointDocs,
  ApiUpdateEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import { createSuccessResponse, type HttpSuccessResponse } from '../../../../../shared/presentation/http/response/http-response-envelope';
import {
  CREATE_ROLE_USE_CASE,
  DELETE_ROLE_USE_CASE,
  LIST_ROLES_USE_CASE,
  UPDATE_ROLE_USE_CASE,
} from '../../../application/tokens';
import { CreateRoleUseCase } from '../../../application/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from '../../../application/use-cases/delete-role.use-case';
import { ListRolesUseCase } from '../../../application/use-cases/list-roles.use-case';
import { UpdateRoleUseCase } from '../../../application/use-cases/update-role.use-case';
import {
  IAM_ROLES_CREATE_PERMISSION,
  IAM_ROLES_DELETE_PERMISSION,
  IAM_ROLES_READ_PERMISSION,
  IAM_ROLES_UPDATE_PERMISSION,
} from '../../../domain/constants/permission-name.constants';
import {
  AdminRoleHttpResponseDto,
  AdminRoleResponseDto,
  AdminRoleRouteParamsDto,
  AdminRolesHttpResponseDto,
  CreateRoleBodyDto,
  UpdateRoleBodyDto,
} from '../dto/admin-roles.dto';
import { AdminPresenter } from '../presenters/admin.presenter';

@ApiTags('Admin Roles')
@ApiBearerAuth('access-token')
@Controller('admin/roles')
export class AdminRolesController {
  constructor(
    @Inject(LIST_ROLES_USE_CASE)
    private readonly listRolesUseCase: ListRolesUseCase,
    @Inject(CREATE_ROLE_USE_CASE)
    private readonly createRoleUseCase: CreateRoleUseCase,
    @Inject(UPDATE_ROLE_USE_CASE)
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    @Inject(DELETE_ROLE_USE_CASE)
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  @Get()
  @RequirePermissions(IAM_ROLES_READ_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List roles for system administration',
    description: 'Returns the role catalog, including system and custom roles.',
    badRequestDescription: 'The request could not be processed.',
    successDescription: 'The roles were returned successfully.',
    responseType: AdminRolesHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.roles.read.')
  async listRoles(): Promise<HttpSuccessResponse<AdminRoleResponseDto[]>> {
    const roles = await this.listRolesUseCase.execute();

    return createSuccessResponse(
      roles.map((role) => AdminPresenter.toRoleResponse(role)),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(IAM_ROLES_CREATE_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a custom role',
    description: 'Creates a new custom role and assigns permissions to it.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The role was created successfully.',
    responseType: AdminRoleHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse('The role creation conflicts with existing records or permission constraints.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.roles.create.')
  async createRole(
    @Body() body: CreateRoleBodyDto,
  ): Promise<HttpSuccessResponse<AdminRoleResponseDto>> {
    const result = await this.createRoleUseCase.execute(body);

    if (!result.ok) {
      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toRoleResponse(result.value));
  }

  @Patch(':roleId')
  @RequirePermissions(IAM_ROLES_UPDATE_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update a custom role',
    description: 'Updates a custom role name and replaces its permission set.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The role was updated successfully.',
    responseType: AdminRoleHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse('The role update conflicts with protected system-role rules or permission constraints.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.roles.update.')
  @ApiNotFoundErrorResponse('The requested role was not found.')
  async updateRole(
    @Param() params: AdminRoleRouteParamsDto,
    @Body() body: UpdateRoleBodyDto,
  ): Promise<HttpSuccessResponse<AdminRoleResponseDto>> {
    const result = await this.updateRoleUseCase.execute({
      roleId: params.roleId,
      name: body.name,
      permissionNames: body.permissionNames,
    });

    if (!result.ok) {
      if (result.error === 'Role was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toRoleResponse(result.value));
  }

  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(IAM_ROLES_DELETE_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete a custom role',
    description: 'Deletes a custom role when it is not protected or assigned to users.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The role was deleted successfully.',
    additionalResponses: [
      ApiConflictErrorResponse('The role cannot be deleted because it is protected or still assigned.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.roles.delete.')
  @ApiNotFoundErrorResponse('The requested role was not found.')
  async deleteRole(@Param() params: AdminRoleRouteParamsDto): Promise<void> {
    const result = await this.deleteRoleUseCase.execute(params.roleId);

    if (!result.ok) {
      if (result.error === 'Role was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }
  }
}
