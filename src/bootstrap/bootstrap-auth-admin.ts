import { loadRuntimeAppConfig } from './config/app-config';
import { createBootstrapLogger } from './logging/bootstrap-logger';
import { PrismaService } from '../shared/infrastructure/database/prisma.service';
import { ScryptPasswordHasher } from '../contexts/iam/infrastructure/providers/scrypt-password-hasher';
import { seedIamAuthData } from '../contexts/iam/infrastructure/bootstrap/seed-iam-auth';
import { logBootstrapPrismaError } from './log-bootstrap-prisma-error';

async function bootstrapAuthAdmin() {
  const logger = createBootstrapLogger();
  const appConfig = loadRuntimeAppConfig();

  if (!appConfig.auth.bootstrapAdmin) {
    throw new Error(
      'BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be configured before running bootstrap-auth-admin.',
    );
  }

  const prisma = new PrismaService(appConfig);
  const passwordHasher = new ScryptPasswordHasher();

  try {
    await prisma.$connect();
    await seedIamAuthData(prisma, passwordHasher, appConfig);
    logger.log('Bootstrapped IAM roles, permissions, and admin user.');
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapAuthAdmin().catch((error: unknown) => {
  const logger = createBootstrapLogger();
  logBootstrapPrismaError(
    error,
    logger.error.bind(logger),
    'Failed to bootstrap IAM auth data',
  );
  process.exitCode = 1;
});
