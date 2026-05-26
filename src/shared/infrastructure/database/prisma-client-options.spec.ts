import { loadAppConfig } from '../../../bootstrap/config/app-config';
import { createPrismaClientOptions } from './prisma-client-options';

const TEST_CA_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIBhTCCASugAwIBAgIUQGd0dW1teS1jYS1jZXJ0aWZpY2F0ZTAKBggqhkjOPQQDAjAc
MRowGAYDVQQDDBFUZXN0IENBIENlcnRpZmljYXRlMB4XDTI2MDUyNjAwMDAwMFoXDTM2
MDUyMzAwMDAwMFowHDEaMBgGA1UEAwwRVGVzdCBDQSBDZXJ0aWZpY2F0ZTBZMBMGByqG
SM49AgEGCCqGSM49AwEHA0IABDv0Kx8Q6d0Sx7p0d3V8M0l0R1A5N2N4dE1uV0VhQk5r
L0h2TmxhR0d3L1Q1T2dFbS9mbE9mRjZyM3lrd2l4a1V3dDg4Q2h3Q2xqUzBRMA4GA1Ud
DwEB/wQEAwIBBjASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBT8l7KxjQw0Q5aN
E3S8V4mN8W7BvTAKBggqhkjOPQQDAgNHADBEAiBqjM1Yv9Z3t2m0pY2j2Q2oK6qQY9nE
2M0VnR0z0xjPbgIgN2dWm6vK0L7f3v1a4Xx8E0kqS0C2i4vQmN0xXg1xQ0=
-----END CERTIFICATE-----`;
const TEST_CA_CERTIFICATE_BASE64 = Buffer.from(TEST_CA_CERTIFICATE).toString(
  'base64',
);

describe('createPrismaClientOptions', () => {
  it('builds Prisma adapter options from the connection string by default', () => {
    const appConfig = loadAppConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    const options = createPrismaClientOptions(appConfig);
    const adapterConfig = readAdapterConfig(options);

    expect(options.adapter).toBeDefined();
    expect(adapterConfig).toEqual({
      connectionString: 'postgresql://user:password@localhost:5432/app',
    });
  });

  it('attaches SSL CA options and removes legacy SSL query parameters', () => {
    const appConfig = loadAppConfig({
      DATABASE_URL:
        'postgresql://user:password@localhost:5432/app?sslmode=verify-ca&application_name=nest-api',
      DATABASE_CA_BASE64: TEST_CA_CERTIFICATE_BASE64,
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    const options = createPrismaClientOptions(appConfig);
    const adapterConfig = readAdapterConfig(options);

    expect(adapterConfig).toEqual({
      connectionString:
        'postgresql://user:password@localhost:5432/app?application_name=nest-api',
      ssl: {
        ca: TEST_CA_CERTIFICATE,
        rejectUnauthorized: true,
      },
    });
  });

  it('preserves unrelated Prisma adapter settings when CA-based SSL is enabled', () => {
    const appConfig = loadAppConfig({
      DATABASE_URL:
        'postgresql://user:password@localhost:5432/app?connect_timeout=10',
      DATABASE_CA_BASE64: TEST_CA_CERTIFICATE_BASE64,
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    const options = createPrismaClientOptions(appConfig);
    const adapterConfig = readAdapterConfig(options);

    expect(adapterConfig.connectionString).toBe(
      'postgresql://user:password@localhost:5432/app?connect_timeout=10',
    );
    expect(adapterConfig.ssl).toEqual({
      ca: TEST_CA_CERTIFICATE,
      rejectUnauthorized: true,
    });
  });
});

function readAdapterConfig(options: ReturnType<typeof createPrismaClientOptions>) {
  return (
    options.adapter as unknown as { config: Record<string, unknown> }
  ).config;
}
