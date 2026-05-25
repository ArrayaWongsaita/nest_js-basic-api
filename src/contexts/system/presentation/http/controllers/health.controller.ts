import { Controller, Get, Inject } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';
import { Public } from '../../../../../shared/presentation/http/auth/public.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { GET_HEALTH_USE_CASE } from '../../../application/tokens';
import { GetHealthUseCase } from '../../../application/use-cases/get-health.use-case';
import {
  HealthHttpResponseDto,
  HealthResponseDto,
} from '../dto/health-response.dto';
import { HealthPresenter } from '../presenters/health.presenter';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(GET_HEALTH_USE_CASE)
    private readonly getHealthUseCase: GetHealthUseCase,
  ) {}

  @Get()
  @Public()
  @ZodResponse({ type: HealthHttpResponseDto })
  async getHealth(): Promise<HttpSuccessResponse<HealthResponseDto>> {
    const snapshot = await this.getHealthUseCase.execute();

    return createSuccessResponse(HealthPresenter.toHttpResponse(snapshot));
  }
}
