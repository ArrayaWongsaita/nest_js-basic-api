import { PrismaPg } from '@prisma/adapter-pg';
import type { Prisma } from '@prisma/client';
import type { AppConfig } from '../../../bootstrap/config/app-config';

export function createPrismaClientOptions(
  appConfig: AppConfig,
): Prisma.PrismaClientOptions {
  return {
    adapter: new PrismaPg({
      connectionString: appConfig.database.url,
    }),
  };
}
