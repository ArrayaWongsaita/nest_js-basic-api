import {
  AdminUserView,
} from '../ports/admin-user-management.port';

export interface AdminUserListResult {
  readonly items: readonly AdminUserView[];
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}
