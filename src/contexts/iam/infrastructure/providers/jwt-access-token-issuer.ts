import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  AccessTokenClaims,
  AccessTokenIssuer,
  IssuedAccessToken,
} from '../../application/ports/access-token-issuer.port';

export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number,
  ) {}

  issue(payload: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  }): Promise<IssuedAccessToken> {
    const issuedAt = Math.floor(Date.now() / 1000);
    const claims: AccessTokenClaims = {
      sub: payload.userId,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      iat: issuedAt,
      exp: issuedAt + this.expiresInSeconds,
    };

    return Promise.resolve({
      token: this.sign(claims),
      expiresInSeconds: this.expiresInSeconds,
    });
  }

  verify(token: string): Promise<AccessTokenClaims> {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return Promise.reject(new Error('Malformed access token.'));
    }

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.signSegment(unsignedToken);
    const encodedSignatureBuffer = Buffer.from(encodedSignature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (encodedSignatureBuffer.length !== expectedSignatureBuffer.length) {
      return Promise.reject(new Error('Invalid access token signature.'));
    }

    if (
      !timingSafeEqual(
        expectedSignatureBuffer,
        encodedSignatureBuffer,
      )
    ) {
      return Promise.reject(new Error('Invalid access token signature.'));
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString(
      'utf8',
    );
    const claims = JSON.parse(payloadJson) as AccessTokenClaims;

    if (
      !claims.sub ||
      !claims.email ||
      !Array.isArray(claims.roles) ||
      !Array.isArray(claims.permissions)
    ) {
      return Promise.reject(new Error('Access token payload is invalid.'));
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (claims.exp <= nowInSeconds) {
      return Promise.reject(new Error('Access token has expired.'));
    }

    return Promise.resolve(claims);
  }

  private sign(claims: AccessTokenClaims): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const encodedPayload = Buffer.from(JSON.stringify(claims)).toString(
      'base64url',
    );
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    return `${unsignedToken}.${this.signSegment(unsignedToken)}`;
  }

  private signSegment(value: string): string {
    return createHmac('sha256', this.secret)
      .update(value)
      .digest('base64url');
  }
}
