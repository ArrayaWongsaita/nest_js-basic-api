import { PrismaPg } from '@prisma/adapter-pg';
import type { Prisma } from '../../../../generated/prisma/client';
import type { AppConfig } from '../../../bootstrap/config/app-config';

type PrismaPgConnectionConfig = Exclude<
  ConstructorParameters<typeof PrismaPg>[0],
  string
>;

export function createPrismaClientOptions(
  appConfig: AppConfig,
): Prisma.PrismaClientOptions {
  return {
    adapter: new PrismaPg(createDatabaseConnectionConfig(appConfig)),
  };
}

function createDatabaseConnectionConfig(
  appConfig: AppConfig,
): PrismaPgConnectionConfig {
  if (!appConfig.database.caCertificate) {
    return {
      connectionString: appConfig.database.url,
    };
  }

  return {
    connectionString: removeLegacySslQueryParameters(appConfig.database.url),
    ssl: {
      ca: appConfig.database.caCertificate,
      rejectUnauthorized: true,
    },
  };
}

function removeLegacySslQueryParameters(connectionString: string): string {
  const url = new URL(connectionString);

  for (const parameter of SSL_QUERY_PARAMETERS) {
    url.searchParams.delete(parameter);
  }

  return url.toString();
}

const SSL_QUERY_PARAMETERS = [
  'ssl',
  'sslcert',
  'sslkey',
  'sslmode',
  'sslrootcert',
];
