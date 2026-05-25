import { HealthSnapshot } from '../../../application/use-cases/get-health.use-case';
import { HealthResponseDto } from '../dto/health-response.dto';

export class HealthPresenter {
  static toHttpResponse(snapshot: HealthSnapshot): HealthResponseDto {
    return {
      status: snapshot.status,
      service: snapshot.service,
      timestamp: snapshot.timestamp,
    };
  }
}
