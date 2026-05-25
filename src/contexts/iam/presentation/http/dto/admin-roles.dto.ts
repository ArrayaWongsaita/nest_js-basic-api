import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { buildSuccessResponseSchema } from '../../../../../shared/presentation/http/response/http-response-envelope';

export const AdminPermissionSummarySchema = z.object({
  id: z.string().uuid().meta({
    description: 'Unique identifier of the permission.',
    example: '6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31',
  }),
  name: z.string().min(1).meta({
    description: 'Canonical permission name.',
    example: 'todo.read_own',
  }),
  isSystem: z.boolean().meta({
    description: 'Whether the permission is a protected system permission.',
    example: true,
  }),
}).meta({ id: 'AdminPermissionSummary' });

export const AdminRoleSchema = z.object({
  id: z.string().uuid().meta({
    description: 'Unique identifier of the role.',
    example: 'f65fb659-0be1-4994-a82e-f72c6d89a740',
  }),
  name: z.string().min(1).meta({
    description: 'Canonical role name.',
    example: 'mentor',
  }),
  isSystem: z.boolean().meta({
    description: 'Whether the role is a protected system role.',
    example: false,
  }),
  permissions: z.array(AdminPermissionSummarySchema).meta({
    description: 'Permissions granted by this role.',
  }),
}).meta({ id: 'AdminRole' });

export class AdminRoleResponseDto extends createZodDto(AdminRoleSchema) {}

export const AdminRolesHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminRolesHttpResponse',
  dataSchema: z.array(AdminRoleSchema),
});

export class AdminRolesHttpResponseDto extends createZodDto(
  AdminRolesHttpResponseSchema,
) {}

export const AdminRoleHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminRoleHttpResponse',
  dataSchema: AdminRoleSchema,
});

export class AdminRoleHttpResponseDto extends createZodDto(
  AdminRoleHttpResponseSchema,
) {}

export const CreateRoleBodySchema = z.object({
  name: z.string().min(1).meta({
    description: 'Canonical name for the custom role.',
    example: 'mentor',
  }),
  permissionNames: z.array(z.string().min(1)).default([]).meta({
    description: 'Permission names granted by the custom role.',
    example: ['todo.read_own'],
  }),
}).meta({ id: 'CreateRoleBody' });

export class CreateRoleBodyDto extends createZodDto(CreateRoleBodySchema) {}

export const UpdateRoleBodySchema = CreateRoleBodySchema.meta({
  id: 'UpdateRoleBody',
});

export class UpdateRoleBodyDto extends createZodDto(UpdateRoleBodySchema) {}

export const AdminRoleRouteParamsSchema = z.object({
  roleId: z.string().uuid().meta({
    description: 'Unique identifier of the target role.',
    example: 'f65fb659-0be1-4994-a82e-f72c6d89a740',
  }),
}).meta({ id: 'AdminRoleRouteParams' });

export class AdminRoleRouteParamsDto extends createZodDto(
  AdminRoleRouteParamsSchema,
) {}
