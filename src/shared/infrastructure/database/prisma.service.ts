import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { APP_CONFIG } from '../../../bootstrap/config/app-config';
import type { AppConfig } from '../../../bootstrap/config/app-config';
import { createPrismaClientOptions } from './prisma-client-options';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(APP_CONFIG) appConfig: AppConfig) {
    super(createPrismaClientOptions(appConfig));
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
