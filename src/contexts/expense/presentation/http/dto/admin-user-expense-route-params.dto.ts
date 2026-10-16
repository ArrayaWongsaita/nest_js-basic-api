import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminExpenseOwnerRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the expenses.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
  })
  .meta({ id: 'AdminExpenseOwnerRouteParams' });

export const AdminUserExpenseRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the expense.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    expenseId: z.string().uuid().meta({
      description: 'Unique identifier of the expense.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'AdminUserExpenseRouteParams' });

export class AdminExpenseOwnerRouteParamsDto extends createZodDto(
  AdminExpenseOwnerRouteParamsSchema,
) {}
export class AdminUserExpenseRouteParamsDto extends createZodDto(
  AdminUserExpenseRouteParamsSchema,
) {}
