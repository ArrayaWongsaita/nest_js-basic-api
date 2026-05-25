import { loadRuntimeAppConfig } from './config/app-config';
import { createBootstrapLogger } from './logging/bootstrap-logger';
import { PrismaService } from '../shared/infrastructure/database/prisma.service';
import { ScryptPasswordHasher } from '../contexts/iam/infrastructure/providers/scrypt-password-hasher';
import { seedIamDemoUsers } from '../contexts/iam/infrastructure/bootstrap/seed-iam-demo-users';
import { logBootstrapPrismaError } from './log-bootstrap-prisma-error';

async function bootstrapDemoUsers() {
  const logger = createBootstrapLogger();
  const appConfig = loadRuntimeAppConfig();
  const prisma = new PrismaService(appConfig);
  const passwordHasher = new ScryptPasswordHasher();

  try {
    await prisma.$connect();
    await seedIamDemoUsers(prisma, passwordHasher, appConfig);
    logger.log('Bootstrapped IAM roles, permissions, and demo student users.');
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapDemoUsers().catch((error: unknown) => {
  const logger = createBootstrapLogger();
  logBootstrapPrismaError(
    error,
    logger.error.bind(logger),
    'Failed to bootstrap demo IAM users',
  );
  process.exitCode = 1;
});
