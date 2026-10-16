export interface AccessTokenClaims {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  /** When true the token may only be used to change the password. */
  mustChangePassword?: boolean;
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
    mustChangePassword?: boolean;
  }): Promise<IssuedAccessToken>;
  verify(token: string): Promise<AccessTokenClaims>;
}
