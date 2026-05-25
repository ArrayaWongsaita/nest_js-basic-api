import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { buildSuccessResponseSchema } from '../../../../../shared/presentation/http/response/http-response-envelope';
import { AdminPermissionSummarySchema } from './admin-roles.dto';

export class AdminPermissionResponseDto extends createZodDto(
  AdminPermissionSummarySchema,
) {}

export const AdminPermissionsHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminPermissionsHttpResponse',
  dataSchema: z.array(AdminPermissionSummarySchema),
});

export class AdminPermissionsHttpResponseDto extends createZodDto(
  AdminPermissionsHttpResponseSchema,
) {}

export const AdminPermissionHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminPermissionHttpResponse',
  dataSchema: AdminPermissionSummarySchema,
});

export class AdminPermissionHttpResponseDto extends createZodDto(
  AdminPermissionHttpResponseSchema,
) {}

export const CreatePermissionBodySchema = z.object({
  name: z.string().min(1).meta({
    description: 'Canonical name for the custom permission.',
    example: 'todo.export',
  }),
}).meta({ id: 'CreatePermissionBody' });

export class CreatePermissionBodyDto extends createZodDto(
  CreatePermissionBodySchema,
) {}

export const UpdatePermissionBodySchema = CreatePermissionBodySchema.meta({
  id: 'UpdatePermissionBody',
});

export class UpdatePermissionBodyDto extends createZodDto(
  UpdatePermissionBodySchema,
) {}

export const AdminPermissionRouteParamsSchema = z.object({
  permissionId: z.string().uuid().meta({
    description: 'Unique identifier of the target permission.',
    example: '6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31',
  }),
}).meta({ id: 'AdminPermissionRouteParams' });

export class AdminPermissionRouteParamsDto extends createZodDto(
  AdminPermissionRouteParamsSchema,
) {}
