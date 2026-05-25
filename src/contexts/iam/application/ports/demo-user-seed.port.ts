import { DemoUserSeedResult } from '../dto/demo-user-seed.result';

export interface DemoUserSeedPort {
  seedDemoUsers(): Promise<DemoUserSeedResult>;
}
