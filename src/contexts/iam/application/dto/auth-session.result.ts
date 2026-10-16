export interface AuthSessionResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  mustChangePassword: boolean;
  user: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
  };
}
