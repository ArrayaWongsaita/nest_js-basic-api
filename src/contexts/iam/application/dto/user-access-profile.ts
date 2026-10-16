export interface UserAccessProfile {
  userId: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  isSystem: boolean;
  mustChangePassword: boolean;
  isDeleted: boolean;
  roles: string[];
  permissions: string[];
}
