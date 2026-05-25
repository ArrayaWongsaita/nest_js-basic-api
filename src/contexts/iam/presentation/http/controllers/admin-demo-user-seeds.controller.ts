import {
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
import { ApiUpdateEndpointDocs } from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import {
  createPrismaSchemaDriftMessage,
  isPrismaSchemaDriftError,
} from '../../../../../shared/infrastructure/database/prisma-schema-drift';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { SEED_DEMO_USERS_USE_CASE } from '../../../application/tokens';
import { SeedDemoUsersUseCase } from '../../../application/use-cases/seed-demo-users.use-case';
import { SYSTEM_RESET_ANY_PERMISSION } from '../../../domain/constants/permission-name.constants';
import {
  AdminDemoUserSeedHttpResponseDto,
  AdminDemoUserSeedResponseDto,
} from '../dto/admin-demo-user-seeds.dto';
import { AdminPresenter } from '../presenters/admin.presenter';

@ApiTags('Admin Demo User Seeds')
@ApiBearerAuth('access-token')
@Controller('admin/demo-user-seeds')
export class AdminDemoUserSeedsController {
  constructor(
    @Inject(SEED_DEMO_USERS_USE_CASE)
    private readonly seedDemoUsersUseCase: SeedDemoUsersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(SYSTEM_RESET_ANY_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Seed baseline IAM data and demo student users',
    description:
      'Runs a synchronous admin maintenance seed that reconciles the IAM baseline and student1@mail.com through student60@mail.com.',
    badRequestDescription: 'The request could not be processed.',
    successDescription: 'The demo student users were seeded successfully.',
    responseType: AdminDemoUserSeedHttpResponseDto,
    additionalResponses: [
      ApiConflictErrorResponse(
        'The database schema is behind the Prisma schema or the seed conflicts with protected maintenance rules.',
      ),
    ],
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The authenticated user is missing system.reset.any.')
  async createSeed(): Promise<
    HttpSuccessResponse<AdminDemoUserSeedResponseDto>
  > {
    try {
      const result = await this.seedDemoUsersUseCase.execute();

      return createSuccessResponse(
        AdminPresenter.toDemoUserSeedResponse(result),
      );
    } catch (error) {
      if (isPrismaSchemaDriftError(error)) {
        throw new ConflictException(createPrismaSchemaDriftMessage());
      }

      throw error;
    }
  }
}
