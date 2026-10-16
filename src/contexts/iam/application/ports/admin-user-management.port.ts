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
  readonly deletedAt: Date | null;
  readonly roles: readonly AdminAssignedRoleView[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface AdminUserListFilters {
  readonly search?: string;
  readonly isActive?: boolean;
  readonly roleName?: string;
  /** Soft-deleted users are hidden unless this is true. */
  readonly includeDeleted?: boolean;
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
  softDeleteUser(userId: string): Promise<AdminUserView | null>;
  restoreUser(userId: string): Promise<AdminUserView | null>;
  countActiveAdmins(): Promise<number>;
  countSystemUsers(): Promise<number>;
  clearAuthSessionsForUser(userId: string): Promise<number>;
  clearAllAuthSessions(): Promise<number>;
  deleteNonSystemUserById(userId: string): Promise<number>;
  deleteNonSystemUsers(): Promise<number>;
}
