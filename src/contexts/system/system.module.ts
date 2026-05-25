import { Module } from '@nestjs/common';
import { CLOCK } from '../../shared/application/tokens';
import { SystemClock } from '../../shared/infrastructure/system-clock';
import { GET_HEALTH_USE_CASE } from './application/tokens';
import { GetHealthUseCase } from './application/use-cases/get-health.use-case';
import { HealthController } from './presentation/http/controllers/health.controller';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: CLOCK,
      useFactory: () => new SystemClock(),
    },
    {
      provide: GET_HEALTH_USE_CASE,
      useFactory: (clock: SystemClock) => new GetHealthUseCase(clock),
      inject: [CLOCK],
    },
  ],
})
export class SystemModule {}
