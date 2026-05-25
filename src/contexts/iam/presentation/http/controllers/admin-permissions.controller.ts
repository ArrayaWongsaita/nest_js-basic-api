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
  CREATE_PERMISSION_USE_CASE,
  DELETE_PERMISSION_USE_CASE,
  LIST_PERMISSIONS_USE_CASE,
  UPDATE_PERMISSION_USE_CASE,
} from '../../../application/tokens';
import { CreatePermissionUseCase } from '../../../application/use-cases/create-permission.use-case';
import { DeletePermissionUseCase } from '../../../application/use-cases/delete-permission.use-case';
import { ListPermissionsUseCase } from '../../../application/use-cases/list-permissions.use-case';
import { UpdatePermissionUseCase } from '../../../application/use-cases/update-permission.use-case';
import {
  IAM_PERMISSIONS_CREATE_PERMISSION,
  IAM_PERMISSIONS_DELETE_PERMISSION,
  IAM_PERMISSIONS_READ_PERMISSION,
  IAM_PERMISSIONS_UPDATE_PERMISSION,
} from '../../../domain/constants/permission-name.constants';
import {
  AdminPermissionHttpResponseDto,
  AdminPermissionResponseDto,
  AdminPermissionRouteParamsDto,
  AdminPermissionsHttpResponseDto,
  CreatePermissionBodyDto,
  UpdatePermissionBodyDto,
} from '../dto/admin-permissions.dto';
import { AdminPresenter } from '../presenters/admin.presenter';

@ApiTags('Admin Permissions')
@ApiBearerAuth('access-token')
@Controller('admin/permissions')
export class AdminPermissionsController {
  constructor(
    @Inject(LIST_PERMISSIONS_USE_CASE)
    private readonly listPermissionsUseCase: ListPermissionsUseCase,
    @Inject(CREATE_PERMISSION_USE_CASE)
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    @Inject(UPDATE_PERMISSION_USE_CASE)
    private readonly updatePermissionUseCase: UpdatePermissionUseCase,
    @Inject(DELETE_PERMISSION_USE_CASE)
    private readonly deletePermissionUseCase: DeletePermissionUseCase,
  ) {}

  @Get()
  @RequirePermissions(IAM_PERMISSIONS_READ_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List permissions for system administration',
    description: 'Returns the permission catalog, including system and custom permissions.',
    badRequestDescription: 'The request could not be processed.',
    successDescription: 'The permissions were returned successfully.',
    responseType: AdminPermissionsHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.permissions.read.')
  async listPermissions(): Promise<HttpSuccessResponse<AdminPermissionResponseDto[]>> {
    const permissions = await this.listPermissionsUseCase.execute();

    return createSuccessResponse(
      permissions.map((permission) =>
        AdminPresenter.toPermissionResponse(permission),
      ),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(IAM_PERMISSIONS_CREATE_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a custom permission',
    description: 'Creates a new custom permission in the RBAC catalog.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The permission was created successfully.',
    responseType: AdminPermissionHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse('The permission creation conflicts with existing records.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.permissions.create.')
  async createPermission(
    @Body() body: CreatePermissionBodyDto,
  ): Promise<HttpSuccessResponse<AdminPermissionResponseDto>> {
    const result = await this.createPermissionUseCase.execute(body.name);

    if (!result.ok) {
      throw new ConflictException(result.error);
    }

    return createSuccessResponse(
      AdminPresenter.toPermissionResponse(result.value),
    );
  }

  @Patch(':permissionId')
  @RequirePermissions(IAM_PERMISSIONS_UPDATE_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update a custom permission',
    description: 'Updates the canonical name of a custom permission.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The permission was updated successfully.',
    responseType: AdminPermissionHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse('The permission update conflicts with protected system-permission rules or existing records.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.permissions.update.')
  @ApiNotFoundErrorResponse('The requested permission was not found.')
  async updatePermission(
    @Param() params: AdminPermissionRouteParamsDto,
    @Body() body: UpdatePermissionBodyDto,
  ): Promise<HttpSuccessResponse<AdminPermissionResponseDto>> {
    const result = await this.updatePermissionUseCase.execute({
      permissionId: params.permissionId,
      name: body.name,
    });

    if (!result.ok) {
      if (result.error === 'Permission was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }

    return createSuccessResponse(
      AdminPresenter.toPermissionResponse(result.value),
    );
  }

  @Delete(':permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(IAM_PERMISSIONS_DELETE_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete a custom permission',
    description: 'Deletes a custom permission when it is not protected or assigned to roles.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The permission was deleted successfully.',
    additionalResponses: [
      ApiConflictErrorResponse('The permission cannot be deleted because it is protected or still assigned.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing iam.permissions.delete.')
  @ApiNotFoundErrorResponse('The requested permission was not found.')
  async deletePermission(
    @Param() params: AdminPermissionRouteParamsDto,
  ): Promise<void> {
    const result = await this.deletePermissionUseCase.execute(
      params.permissionId,
    );

    if (!result.ok) {
      if (result.error === 'Permission was not found.') {
        throw new NotFoundException(result.error);
      }

      throw new ConflictException(result.error);
    }
  }
}
