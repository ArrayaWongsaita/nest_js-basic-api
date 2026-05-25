import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExpenseRouteParamsSchema = z
  .object({
    expenseId: z.string().uuid().meta({
      description: 'Unique identifier of the transaction.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'ExpenseRouteParams' });

export class ExpenseRouteParamsDto extends createZodDto(ExpenseRouteParamsSchema) {}
