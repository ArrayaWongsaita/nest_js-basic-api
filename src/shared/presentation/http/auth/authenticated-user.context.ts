export interface AuthenticatedUserContext {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}
