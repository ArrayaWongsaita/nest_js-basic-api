import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminBookOwnerRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the books.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
  })
  .meta({ id: 'AdminBookOwnerRouteParams' });

export const AdminUserBookRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the book.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    bookId: z.string().uuid().meta({
      description: 'Unique identifier of the book.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'AdminUserBookRouteParams' });

export class AdminBookOwnerRouteParamsDto extends createZodDto(
  AdminBookOwnerRouteParamsSchema,
) {}
export class AdminUserBookRouteParamsDto extends createZodDto(
  AdminUserBookRouteParamsSchema,
) {}
