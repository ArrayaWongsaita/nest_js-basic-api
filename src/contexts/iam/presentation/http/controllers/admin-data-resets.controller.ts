import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiConflictErrorResponse,
  ApiForbiddenErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import { ApiCreateEndpointDocs } from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import { createSuccessResponse, type HttpSuccessResponse } from '../../../../../shared/presentation/http/response/http-response-envelope';
import { RESET_ADMIN_DATA_USE_CASE } from '../../../application/tokens';
import { ResetAdminDataUseCase } from '../../../application/use-cases/reset-admin-data.use-case';
import { SYSTEM_RESET_ANY_PERMISSION } from '../../../domain/constants/permission-name.constants';
import {
  AdminDataResetHttpResponseDto,
  AdminDataResetResponseDto,
  CreateAdminDataResetBodyDto,
} from '../dto/admin-data-resets.dto';
import { AdminPresenter } from '../presenters/admin.presenter';

@ApiTags('Admin Data Reset')
@ApiBearerAuth('access-token')
@Controller('admin/data-resets')
export class AdminDataResetsController {
  constructor(
    @Inject(RESET_ADMIN_DATA_USE_CASE)
    private readonly resetAdminDataUseCase: ResetAdminDataUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(SYSTEM_RESET_ANY_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Reset demo data for supported domains',
    description: 'Runs a synchronous admin maintenance reset for one user or the full demo environment.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The reset completed successfully.',
    responseType: AdminDataResetHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse('The requested reset conflicts with protected system-user or unsupported reset rules.'),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing system.reset.any.')
  async createReset(
    @Body() body: CreateAdminDataResetBodyDto,
  ): Promise<HttpSuccessResponse<AdminDataResetResponseDto>> {
    const result = await this.resetAdminDataUseCase.execute({
      scope: body.scope,
      targetUserId: body.targetUserId ?? null,
      domains: body.domains,
      mode: body.mode,
      reason: body.reason,
    });

    if (!result.ok) {
      throw new ConflictException(result.error);
    }

    return createSuccessResponse(AdminPresenter.toResetResponse(result.value));
  }
}
