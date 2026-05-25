import { Clock } from '../../../../shared/application/clock.port';
import { GetHealthUseCase } from './get-health.use-case';

class FixedClock implements Clock {
  now(): Date {
    return new Date('2026-05-22T00:00:00.000Z');
  }
}

describe('GetHealthUseCase', () => {
  it('returns a stable health snapshot', async () => {
    const useCase = new GetHealthUseCase(new FixedClock());

    await expect(useCase.execute()).resolves.toEqual({
      status: 'ok',
      service: 'api',
      timestamp: '2026-05-22T00:00:00.000Z',
    });
  });
});
