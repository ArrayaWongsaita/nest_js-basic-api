export interface AdminAssignedRoleView {
  readonly id: string;
  readonly name: string;
  readonly isSystem: boolean;
}

export interface AdminUserView {
  readonly userId: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly isSystem: boolean;
  readonly roles: readonly AdminAssignedRoleView[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AdminUserListFilters {
  readonly search?: string;
  readonly isActive?: boolean;
}

export interface PaginatedAdminUsers {
  readonly items: readonly AdminUserView[];
  readonly totalItems: number;
}

export interface CreateAdminUserInput {
  readonly email: string;
  readonly passwordHash: string;
  readonly roleNames: readonly string[];
}

export interface AdminUserManagementPort {
  findByEmail(email: string): Promise<AdminUserView | null>;
  findById(userId: string): Promise<AdminUserView | null>;
  listUsers(
    filters: AdminUserListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedAdminUsers>;
  createUser(input: CreateAdminUserInput): Promise<AdminUserView>;
  updateUserRoles(
    userId: string,
    roleNames: readonly string[],
  ): Promise<AdminUserView | null>;
  updateUserStatus(
    userId: string,
    isActive: boolean,
  ): Promise<AdminUserView | null>;
  countSystemUsers(): Promise<number>;
  clearAuthSessionsForUser(userId: string): Promise<number>;
  clearAllAuthSessions(): Promise<number>;
  deleteNonSystemUserById(userId: string): Promise<number>;
  deleteNonSystemUsers(): Promise<number>;
}
