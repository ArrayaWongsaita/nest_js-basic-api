import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListExpensesQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1)
      .optional()
      .meta({
        description:
          'Optional case-insensitive text filter applied to the transaction title and note.',
        example: 'grocery',
      }),
    type: z
      .enum(['INCOME', 'EXPENSE'])
      .optional()
      .meta({
        description:
          'Optional transaction type filter. Use INCOME for income transactions or EXPENSE for expense transactions.',
        example: 'EXPENSE',
      }),
    page: z.coerce.number().int().min(1).default(1).meta({
      description:
        '1-based page number for paginated list responses. Defaults to 1.',
      example: 1,
    }),
    limit: z.coerce.number().int().min(1).max(100).default(10).meta({
      description:
        'Maximum number of items returned in one page. Defaults to 10 and cannot exceed 100.',
      example: 10,
    }),
  })
  .meta({ id: 'ListExpensesQuery' });

export class ListExpensesQueryDto extends createZodDto(ListExpensesQuerySchema) {}
