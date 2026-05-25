import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG } from '../../../../../bootstrap/config/app-config';
import type { AppConfig } from '../../../../../bootstrap/config/app-config';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { DemoUserSeedResult } from '../../../application/dto/demo-user-seed.result';
import type { DemoUserSeedPort } from '../../../application/ports/demo-user-seed.port';
import type { PasswordHasher } from '../../../application/ports/password-hasher.port';
import { PASSWORD_HASHER } from '../../../application/tokens';
import {
  IAM_DEMO_STUDENT_SEED,
  seedIamDemoUsers,
} from '../../bootstrap/seed-iam-demo-users';

@Injectable()
export class PrismaDemoUserSeedGateway implements DemoUserSeedPort {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  async seedDemoUsers(): Promise<DemoUserSeedResult> {
    await seedIamDemoUsers(this.prisma, this.passwordHasher, this.appConfig);

    return {
      totalUsers:
        IAM_DEMO_STUDENT_SEED.endIndex - IAM_DEMO_STUDENT_SEED.startIndex + 1,
      firstEmail: `student${IAM_DEMO_STUDENT_SEED.startIndex}@mail.com`,
      lastEmail: `student${IAM_DEMO_STUDENT_SEED.endIndex}@mail.com`,
      roleName: IAM_DEMO_STUDENT_SEED.roleName,
      completedAt: new Date(),
    };
  }
}
