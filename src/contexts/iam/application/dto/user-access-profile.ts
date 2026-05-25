export interface UserAccessProfile {
  userId: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  isSystem: boolean;
  roles: string[];
  permissions: string[];
}
