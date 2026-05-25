import { Response } from 'express';
import { AppConfig } from '../config/app-config';

export function appendRefreshTokenCookie(
  response: Response,
  appConfig: AppConfig,
  refreshToken: string,
): void {
  response.append(
    'Set-Cookie',
    buildCookieValue(appConfig, refreshToken, appConfig.auth.refreshTokenTtlSeconds),
  );
}

export function clearRefreshTokenCookie(
  response: Response,
  appConfig: AppConfig,
): void {
  response.append('Set-Cookie', buildCookieValue(appConfig, '', 0));
}

export function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.trim().split('=');

    if (cookieName === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

function buildCookieValue(
  appConfig: AppConfig,
  value: string,
  maxAgeSeconds: number,
): string {
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);
  const segments = [
    `${appConfig.auth.refreshCookieName}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=None',
    `Max-Age=${maxAgeSeconds}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];

  if (appConfig.environment === 'production') {
    segments.push('Secure');
  }

  return segments.join('; ');
}
