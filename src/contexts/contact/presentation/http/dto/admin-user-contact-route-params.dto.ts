import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminContactOwnerRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the contacts.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
  })
  .meta({ id: 'AdminContactOwnerRouteParams' });

export const AdminUserContactRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the contact.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    contactId: z.string().uuid().meta({
      description: 'Unique identifier of the contact.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'AdminUserContactRouteParams' });

export class AdminContactOwnerRouteParamsDto extends createZodDto(
  AdminContactOwnerRouteParamsSchema,
) {}
export class AdminUserContactRouteParamsDto extends createZodDto(
  AdminUserContactRouteParamsSchema,
) {}
