import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import { ApiListEndpointDocs } from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { LIST_AUDIT_ENTRIES_USE_CASE } from '../../../application/tokens';
import { ListAuditEntriesUseCase } from '../../../application/use-cases/list-audit-entries.use-case';
import { IAM_AUDIT_LOGS_READ_PERMISSION } from '../../../domain/constants/permission-name.constants';
import {
  AdminAuditEntriesHttpResponseDto,
  AdminAuditEntryResponseDto,
  ListAdminAuditEntriesQueryDto,
} from '../dto/admin-audit-logs.dto';
import { AdminPresenter } from '../presenters/admin.presenter';

@ApiTags('Admin Audit Logs')
@ApiBearerAuth('access-token')
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(
    @Inject(LIST_AUDIT_ENTRIES_USE_CASE)
    private readonly listAuditEntriesUseCase: ListAuditEntriesUseCase,
  ) {}

  @Get()
  @RequirePermissions(IAM_AUDIT_LOGS_READ_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List audit entries of administrative actions',
    description:
      'Returns a paginated, newest-first, read-only list of recorded admin actions, including actions rejected by a safety rule.',
    badRequestDescription: 'The request query parameters failed validation.',
    successDescription: 'The audit entries were returned successfully.',
    responseType: AdminAuditEntriesHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.audit_logs.read.',
  )
  async listAuditEntries(
    @Query() query: ListAdminAuditEntriesQueryDto,
  ): Promise<
    HttpSuccessResponse<
      AdminAuditEntryResponseDto[],
      { page: number; limit: number; totalItems: number; totalPages: number }
    >
  > {
    const result = await this.listAuditEntriesUseCase.execute({
      ...query,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });

    return createSuccessResponse(
      AdminPresenter.toAuditEntryListResponse(result),
      AdminPresenter.toListMeta(result),
    );
  }
}
