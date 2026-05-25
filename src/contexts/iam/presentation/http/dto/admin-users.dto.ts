import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { buildSuccessResponseSchema } from '../../../../../shared/presentation/http/response/http-response-envelope';

const AdminUserBooleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}, z.boolean());

const AdminAssignedRoleSchema = z.object({
  id: z.string().uuid().meta({
    description: 'Unique identifier of the assigned role.',
    example: '6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31',
  }),
  name: z.string().min(1).meta({
    description: 'Canonical role name assigned to the user.',
    example: 'student',
  }),
  isSystem: z.boolean().meta({
    description: 'Whether the role is a protected system role.',
    example: true,
  }),
}).meta({ id: 'AdminAssignedRole' });

export const AdminUserSchema = z.object({
  userId: z.string().uuid().meta({
    description: 'Unique identifier of the IAM user.',
    example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
  }),
  email: z.string().email().meta({
    description: 'Email address stored for the user.',
    example: 'learner@example.com',
  }),
  isActive: z.boolean().meta({
    description: 'Whether the user is currently allowed to authenticate.',
    example: true,
  }),
  isSystem: z.boolean().meta({
    description: 'Whether the user is preserved as a system record.',
    example: false,
  }),
  roles: z.array(AdminAssignedRoleSchema).meta({
    description: 'Roles currently assigned to the user.',
  }),
  createdAt: z.string().datetime({ offset: true }).meta({
    description: 'Timestamp when the user was created.',
    example: '2026-05-26T08:30:00.000Z',
  }),
  updatedAt: z.string().datetime({ offset: true }).meta({
    description: 'Timestamp when the user was last updated.',
    example: '2026-05-26T08:30:00.000Z',
  }),
}).meta({ id: 'AdminUser' });

export class AdminUserResponseDto extends createZodDto(AdminUserSchema) {}

export const AdminUserListMetaSchema = z.object({
  page: z.number().int().positive().meta({
    description: 'Current 1-based page number.',
    example: 1,
  }),
  limit: z.number().int().positive().meta({
    description: 'Number of items returned per page.',
    example: 20,
  }),
  totalItems: z.number().int().nonnegative().meta({
    description: 'Total number of users that match the query.',
    example: 3,
  }),
  totalPages: z.number().int().positive().meta({
    description: 'Total number of pages for the current limit.',
    example: 1,
  }),
}).meta({ id: 'AdminUserListMeta' });

export const AdminUsersHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminUsersHttpResponse',
  dataSchema: z.array(AdminUserSchema).meta({
    description: 'Paginated admin user results.',
  }),
  metaSchema: AdminUserListMetaSchema,
});

export class AdminUsersHttpResponseDto extends createZodDto(
  AdminUsersHttpResponseSchema,
) {}

export const AdminUserHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminUserHttpResponse',
  dataSchema: AdminUserSchema,
});

export class AdminUserHttpResponseDto extends createZodDto(
  AdminUserHttpResponseSchema,
) {}

export const ListAdminUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional().meta({
    description: 'Case-insensitive email search text.',
    example: 'learner',
  }),
  isActive: AdminUserBooleanQuerySchema.optional().meta({
    description: 'Optional active-state filter.',
    example: true,
  }),
  page: z.coerce.number().int().positive().default(1).meta({
    description: '1-based page number.',
    example: 1,
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).meta({
    description: 'Maximum number of users to return.',
    example: 20,
  }),
}).meta({ id: 'ListAdminUsersQuery' });

export class ListAdminUsersQueryDto extends createZodDto(
  ListAdminUsersQuerySchema,
) {}

export const CreateAdminUserBodySchema = z.object({
  email: z.string().email().meta({
    description: 'Email address used as the unique identity for the new user.',
    example: 'learner@example.com',
  }),
  password: z.string().min(12).meta({
    description: 'Plain-text password for the new user.',
    example: 'strong-password-123',
  }),
  roleNames: z.array(z.string().min(1)).default([]).meta({
    description: 'Role names to assign during creation. Defaults to student when omitted.',
    example: ['student'],
  }),
}).meta({ id: 'CreateAdminUserBody' });

export class CreateAdminUserBodyDto extends createZodDto(
  CreateAdminUserBodySchema,
) {}

export const UpdateAdminUserRolesBodySchema = z.object({
  roleNames: z.array(z.string().min(1)).min(1).meta({
    description: 'Complete replacement set of role names for the user.',
    example: ['student', 'mentor'],
  }),
}).meta({ id: 'UpdateAdminUserRolesBody' });

export class UpdateAdminUserRolesBodyDto extends createZodDto(
  UpdateAdminUserRolesBodySchema,
) {}

export const UpdateAdminUserStatusBodySchema = z.object({
  isActive: z.boolean().meta({
    description: 'Whether the user should remain able to authenticate.',
    example: false,
  }),
}).meta({ id: 'UpdateAdminUserStatusBody' });

export class UpdateAdminUserStatusBodyDto extends createZodDto(
  UpdateAdminUserStatusBodySchema,
) {}

export const AdminUserRouteParamsSchema = z.object({
  userId: z.string().uuid().meta({
    description: 'Unique identifier of the target user.',
    example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
  }),
}).meta({ id: 'AdminUserRouteParams' });

export class AdminUserRouteParamsDto extends createZodDto(
  AdminUserRouteParamsSchema,
) {}
