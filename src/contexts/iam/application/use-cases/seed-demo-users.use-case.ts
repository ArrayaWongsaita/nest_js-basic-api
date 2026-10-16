import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { DemoUserSeedResult } from '../dto/demo-user-seed.result';
import {
  ADMIN_MAINTENANCE_DISABLED_IN_PRODUCTION_MESSAGE,
  AdminMaintenancePolicy,
} from '../ports/admin-maintenance-policy.port';
import { DemoUserSeedPort } from '../ports/demo-user-seed.port';

export class SeedDemoUsersUseCase implements UseCase<
  void,
  Result<DemoUserSeedResult, string>
> {
  constructor(
    private readonly demoUserSeedPort: DemoUserSeedPort,
    private readonly maintenancePolicy: AdminMaintenancePolicy,
  ) {}

  async execute(): Promise<Result<DemoUserSeedResult, string>> {
    if (!this.maintenancePolicy.allowed) {
      return Result.failure(ADMIN_MAINTENANCE_DISABLED_IN_PRODUCTION_MESSAGE);
    }

    return Result.success(await this.demoUserSeedPort.seedDemoUsers());
  }
}
