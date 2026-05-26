import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadAppConfig } from './app-config';
import { loadRuntimeAppConfig } from './app-config';

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

function createBaseEnv(): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
    JWT_ACCESS_SECRET: 'test-access-secret',
  };
}

describe('loadAppConfig', () => {
  it('maps validated env values into a namespaced typed config object', () => {
    const config = loadAppConfig({
      ...createBaseEnv(),
      PORT: '4100',
      CORS_ALLOWED_ORIGINS: 'https://app.example.com,https://admin.example.com',
    });

    expect(config).toEqual({
      environment: 'development',
      http: {
        port: 4100,
      },
      database: {
        url: 'postgresql://user:password@localhost:5432/app',
        caCertificate: null,
      },
      cors: {
        allowedOrigins: [
          'https://app.example.com',
          'https://admin.example.com',
        ],
      },
      auth: {
        accessTokenSecret: 'test-access-secret',
        accessTokenTtlSeconds: 900,
        refreshCookieName: 'refresh_token',
        refreshTokenTtlSeconds: 2592000,
        bootstrapAdmin: null,
      },
      swagger: {
        enabled: false,
        username: null,
        password: null,
      },
    });
  });

  it('applies defaults for optional env values', () => {
    const config = loadAppConfig(createBaseEnv());

    expect(config.http.port).toBe(3000);
    expect(config.database.caCertificate).toBeNull();
    expect(config.swagger.enabled).toBe(false);
    expect(config.auth.refreshCookieName).toBe('refresh_token');
    expect(config.auth.accessTokenTtlSeconds).toBe(900);
  });

  it('throws a readable error when required env values are missing', () => {
    expect(() => loadAppConfig({})).toThrow(
      'Invalid environment configuration: DATABASE_URL: Invalid input: expected string, received undefined; JWT_ACCESS_SECRET: Invalid input: expected string, received undefined',
    );
  });

  it('maps swagger configuration when enabled', () => {
    const config = loadAppConfig({
      ...createBaseEnv(),
      SWAGGER_ENABLED: 'true',
      SWAGGER_USERNAME: 'docs-user',
      SWAGGER_PASSWORD: 'docs-password',
    });

    expect(config.swagger).toEqual({
      enabled: true,
      username: 'docs-user',
      password: 'docs-password',
    });
  });

  it('requires swagger credentials when swagger is enabled', () => {
    expect(() =>
      loadAppConfig({
        ...createBaseEnv(),
        SWAGGER_ENABLED: 'true',
      }),
    ).toThrow(
      'Invalid environment configuration: SWAGGER_USERNAME and SWAGGER_PASSWORD are required when SWAGGER_ENABLED is true',
    );
  });

  it('requires bootstrap admin credentials to be configured together', () => {
    expect(() =>
      loadAppConfig({
        ...createBaseEnv(),
        BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com',
      }),
    ).toThrow(
      'Invalid environment configuration: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be configured together',
    );
  });

  it('decodes DATABASE_CA_BASE64 into a PEM certificate', () => {
    const config = loadAppConfig({
      ...createBaseEnv(),
      DATABASE_CA_BASE64: TEST_CA_CERTIFICATE_BASE64,
    });

    expect(config.database.caCertificate).toBe(TEST_CA_CERTIFICATE);
  });

  it('fails fast when DATABASE_CA_BASE64 is not valid base64 PEM data', () => {
    expect(() =>
      loadAppConfig({
        ...createBaseEnv(),
        DATABASE_CA_BASE64: 'not-valid-base64',
      }),
    ).toThrow(
      'Invalid environment configuration: DATABASE_CA_BASE64 must be a base64-encoded PEM certificate',
    );
  });

  it('fails fast when DATABASE_CA_BASE64 is explicitly empty', () => {
    expect(() =>
      loadAppConfig({
        ...createBaseEnv(),
        DATABASE_CA_BASE64: '   ',
      }),
    ).toThrow(
      'Invalid environment configuration: DATABASE_CA_BASE64 must be a base64-encoded PEM certificate',
    );
  });
});

describe('loadRuntimeAppConfig', () => {
  const originalCwd = process.cwd();
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalDatabaseCaBase64 = process.env.DATABASE_CA_BASE64;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalPort = process.env.PORT;
  const originalSwaggerEnabled = process.env.SWAGGER_ENABLED;
  const originalSwaggerUsername = process.env.SWAGGER_USERNAME;
  const originalSwaggerPassword = process.env.SWAGGER_PASSWORD;

  afterEach(() => {
    process.chdir(originalCwd);

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    if (originalDatabaseCaBase64 === undefined) {
      delete process.env.DATABASE_CA_BASE64;
    } else {
      process.env.DATABASE_CA_BASE64 = originalDatabaseCaBase64;
    }

    if (originalJwtAccessSecret === undefined) {
      delete process.env.JWT_ACCESS_SECRET;
    } else {
      process.env.JWT_ACCESS_SECRET = originalJwtAccessSecret;
    }

    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }

    if (originalSwaggerEnabled === undefined) {
      delete process.env.SWAGGER_ENABLED;
    } else {
      process.env.SWAGGER_ENABLED = originalSwaggerEnabled;
    }

    if (originalSwaggerUsername === undefined) {
      delete process.env.SWAGGER_USERNAME;
    } else {
      process.env.SWAGGER_USERNAME = originalSwaggerUsername;
    }

    if (originalSwaggerPassword === undefined) {
      delete process.env.SWAGGER_PASSWORD;
    } else {
      process.env.SWAGGER_PASSWORD = originalSwaggerPassword;
    }
  });

  it('loads env values from the local .env file before validation', () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), 'app-config-'));

    writeFileSync(
      join(tempDirectory, '.env'),
      'DATABASE_URL=postgresql://from-env-file\nJWT_ACCESS_SECRET=from-env-secret\nPORT=4200\nSWAGGER_ENABLED=true\nSWAGGER_USERNAME=swagger\nSWAGGER_PASSWORD=secret\n',
    );
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.PORT;
    process.chdir(tempDirectory);

    const config = loadRuntimeAppConfig();

    expect(config).toEqual({
      environment: 'development',
      http: {
        port: 4200,
      },
      database: {
        url: 'postgresql://from-env-file',
        caCertificate: null,
      },
      cors: {
        allowedOrigins: [],
      },
      auth: {
        accessTokenSecret: 'from-env-secret',
        accessTokenTtlSeconds: 900,
        refreshCookieName: 'refresh_token',
        refreshTokenTtlSeconds: 2592000,
        bootstrapAdmin: null,
      },
      swagger: {
        enabled: true,
        username: 'swagger',
        password: 'secret',
      },
    });
  });
});
