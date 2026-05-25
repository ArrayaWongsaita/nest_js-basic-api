import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const DEFAULT_HTTP_PORT = 3000;

const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_HTTP_PORT),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_ACCESS_TTL: z.string().min(1).default('15m'),
  AUTH_REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
  AUTH_REFRESH_TTL: z.string().min(1).default('30d'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).optional(),
  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SWAGGER_USERNAME: z.string().optional(),
  SWAGGER_PASSWORD: z.string().optional(),
});

export type AppConfig = {
  environment: 'development' | 'test' | 'production';
  http: {
    port: number;
  };
  database: {
    url: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  auth: {
    accessTokenSecret: string;
    accessTokenTtlSeconds: number;
    refreshCookieName: string;
    refreshTokenTtlSeconds: number;
    bootstrapAdmin: {
      email: string;
      password: string;
    } | null;
  };
  swagger: {
    enabled: boolean;
    username: string | null;
    password: string | null;
  };
};

export const APP_CONFIG = Symbol('APP_CONFIG');

export function loadAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const parsedEnv = rawEnvSchema.safeParse(env);

  if (!parsedEnv.success) {
    const message = parsedEnv.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return mapRawEnvToAppConfig(parsedEnv.data);
}

export function loadRuntimeAppConfig(): AppConfig {
  const dotEnvPath = resolve(process.cwd(), '.env');

  if (existsSync(dotEnvPath)) {
    hydrateProcessEnvFromDotEnv(dotEnvPath);
  }

  return loadAppConfig(process.env);
}

function mapRawEnvToAppConfig(env: z.infer<typeof rawEnvSchema>): AppConfig {
  const swaggerUsername = env.SWAGGER_USERNAME?.trim() || null;
  const swaggerPassword = env.SWAGGER_PASSWORD?.trim() || null;
  const bootstrapAdminEmail = env.BOOTSTRAP_ADMIN_EMAIL?.trim() || null;
  const bootstrapAdminPassword = env.BOOTSTRAP_ADMIN_PASSWORD?.trim() || null;

  if (env.SWAGGER_ENABLED && (!swaggerUsername || !swaggerPassword)) {
    throw new Error(
      'Invalid environment configuration: SWAGGER_USERNAME and SWAGGER_PASSWORD are required when SWAGGER_ENABLED is true',
    );
  }

  if (
    (bootstrapAdminEmail && !bootstrapAdminPassword) ||
    (!bootstrapAdminEmail && bootstrapAdminPassword)
  ) {
    throw new Error(
      'Invalid environment configuration: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be configured together',
    );
  }

  return {
    environment: env.NODE_ENV,
    http: {
      port: env.PORT,
    },
    database: {
      url: env.DATABASE_URL,
    },
    cors: {
      allowedOrigins: parseCorsAllowedOrigins(env.CORS_ALLOWED_ORIGINS),
    },
    auth: {
      accessTokenSecret: env.JWT_ACCESS_SECRET,
      accessTokenTtlSeconds: parseDurationToSeconds(env.JWT_ACCESS_TTL),
      refreshCookieName: env.AUTH_REFRESH_COOKIE_NAME.trim(),
      refreshTokenTtlSeconds: parseDurationToSeconds(env.AUTH_REFRESH_TTL),
      bootstrapAdmin:
        bootstrapAdminEmail && bootstrapAdminPassword
          ? {
              email: bootstrapAdminEmail,
              password: bootstrapAdminPassword,
            }
          : null,
    },
    swagger: {
      enabled: env.SWAGGER_ENABLED,
      username: swaggerUsername,
      password: swaggerPassword,
    },
  };
}

function hydrateProcessEnvFromDotEnv(dotEnvPath: string): void {
  const fileContents = readFileSync(dotEnvPath, 'utf8');
  const entries = fileContents.split(/\r?\n/);

  for (const entry of entries) {
    const trimmedEntry = entry.trim();

    if (!trimmedEntry || trimmedEntry.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedEntry.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedEntry.slice(0, separatorIndex).trim();
    const rawValue = trimmedEntry.slice(separatorIndex + 1).trim();

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripWrappingQuotes(rawValue);
  }
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseCorsAllowedOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function parseDurationToSeconds(value: string): number {
  const trimmedValue = value.trim().toLowerCase();
  const durationMatch = /^(?<amount>\d+)(?<unit>[smhd])$/.exec(trimmedValue);

  if (!durationMatch?.groups) {
    throw new Error(
      `Invalid environment configuration: unsupported duration value "${value}"`,
    );
  }

  const amount = Number(durationMatch.groups.amount);
  const unit = durationMatch.groups.unit;

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      throw new Error(
        `Invalid environment configuration: unsupported duration unit "${unit}"`,
      );
  }
}
