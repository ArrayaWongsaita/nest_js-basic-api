import { Clock } from '../../../../shared/application/clock.port';
import { UseCase } from '../../../../shared/application/use-case';

export interface HealthSnapshot {
  readonly status: 'ok';
  readonly service: string;
  readonly timestamp: string;
}

export class GetHealthUseCase implements UseCase<void, HealthSnapshot> {
  constructor(private readonly clock: Clock) {}

  execute(): Promise<HealthSnapshot> {
    return Promise.resolve({
      status: 'ok',
      service: 'api',
      timestamp: this.clock.now().toISOString(),
    });
  }
}
