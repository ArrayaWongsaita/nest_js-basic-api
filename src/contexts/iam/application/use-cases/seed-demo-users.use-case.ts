import { UseCase } from '../../../../shared/application/use-case';
import { DemoUserSeedResult } from '../dto/demo-user-seed.result';
import { DemoUserSeedPort } from '../ports/demo-user-seed.port';

export class SeedDemoUsersUseCase
  implements UseCase<void, DemoUserSeedResult>
{
  constructor(private readonly demoUserSeedPort: DemoUserSeedPort) {}

  async execute(): Promise<DemoUserSeedResult> {
    return this.demoUserSeedPort.seedDemoUsers();
  }
}
