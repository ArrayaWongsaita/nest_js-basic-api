export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

export interface IssuedAccessToken {
  token: string;
  expiresInSeconds: number;
}

export interface AccessTokenIssuer {
  issue(payload: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  }): Promise<IssuedAccessToken>;
  verify(token: string): Promise<AccessTokenClaims>;
}
