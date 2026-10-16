import {
  AdminUserListFilters,
  AdminUserManagementPort,
  AdminUserView,
} from '../ports/admin-user-management.port';
import { ListAdminUsersUseCase } from './list-admin-users.use-case';

function user(
  email: string,
  isActive: boolean,
  roleNames: string[],
): AdminUserView {
  return {
    userId: email,
    email,
    isActive,
    isSystem: false,
    deletedAt: null,
    roles: roleNames.map((name) => ({ id: name, name, isSystem: false })),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

function createUseCase(users: AdminUserView[]) {
  const port = {
    listUsers: (filters: AdminUserListFilters, page: number, limit: number) => {
      const matched = users.filter(
        (u) =>
          (filters.search === undefined || u.email.includes(filters.search)) &&
          (filters.isActive === undefined || u.isActive === filters.isActive) &&
          (filters.roleName === undefined ||
            u.roles.some((r) => r.name === filters.roleName)),
      );
      return Promise.resolve({
        items: matched.slice((page - 1) * limit, page * limit),
        totalItems: matched.length,
      });
    },
  } as unknown as AdminUserManagementPort;

  return new ListAdminUsersUseCase(port);
}

describe('ListAdminUsersUseCase role filter', () => {
  const users = [
    user('a1@x.com', true, ['admin']),
    user('s1@x.com', true, ['student']),
    user('s2@x.com', false, ['student']),
    user('s3@x.com', true, ['student', 'mentor']),
    user('s4@x.com', true, ['student']),
  ];

  it('returns only users holding the requested role', async () => {
    const result = await createUseCase(users).execute({
      roleName: 'admin',
      page: 1,
      limit: 10,
    });

    expect(result.items.map((u) => u.email)).toEqual(['a1@x.com']);
    expect(result.totalItems).toBe(1);
  });

  it('returns an empty list, not an error, for an unknown role', async () => {
    const result = await createUseCase(users).execute({
      roleName: 'ghost',
      page: 1,
      limit: 10,
    });

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(1);
  });

  it('combines role with search, active status and pagination', async () => {
    const useCase = createUseCase(users);

    const combined = await useCase.execute({
      roleName: 'student',
      isActive: true,
      search: 's',
      page: 1,
      limit: 10,
    });
    expect(combined.items.map((u) => u.email)).toEqual([
      's1@x.com',
      's3@x.com',
      's4@x.com',
    ]);

    const secondPage = await useCase.execute({
      roleName: 'student',
      isActive: true,
      page: 2,
      limit: 2,
    });
    expect(secondPage.items.map((u) => u.email)).toEqual(['s4@x.com']);
    expect(secondPage.totalItems).toBe(3);
    expect(secondPage.totalPages).toBe(2);
  });
});
