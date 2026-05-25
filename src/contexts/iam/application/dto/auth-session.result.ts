export interface AuthSessionResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}
