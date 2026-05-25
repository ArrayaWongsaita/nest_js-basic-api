import { loadAppConfig } from '../../../bootstrap/config/app-config';
import { createPrismaClientOptions } from './prisma-client-options';

describe('createPrismaClientOptions', () => {
  it('builds Prisma adapter options from validated app config', () => {
    const appConfig = loadAppConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    const options = createPrismaClientOptions(appConfig);

    expect(options.adapter).toBeDefined();
  });
});
