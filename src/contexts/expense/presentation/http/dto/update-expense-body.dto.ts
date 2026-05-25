import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateExpenseBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated short title for the transaction.',
        example: 'Monthly grocery shopping',
      }),
    amount: z
      .number()
      .positive()
      .optional()
      .meta({
        description: 'Updated transaction amount. Must be a positive number.',
        example: 45.5,
      }),
    type: z
      .enum(['INCOME', 'EXPENSE'])
      .optional()
      .meta({
        description: 'Updated transaction type: INCOME or EXPENSE.',
        example: 'INCOME',
      }),
    note: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated optional note. Use null to clear the current note.',
        example: 'Updated grocery note.',
      }),
    transactionDate: z
      .string()
      .datetime({ offset: true })
      .optional()
      .meta({
        description:
          'Updated transaction date in ISO 8601 format with timezone offset.',
        example: '2026-05-26T10:00:00.000Z',
      }),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.amount !== undefined ||
      value.type !== undefined ||
      value.note !== undefined ||
      value.transactionDate !== undefined,
    {
      message: 'At least one field must be provided.',
    },
  )
  .meta({ id: 'UpdateExpenseBody' });

export class UpdateExpenseBodyDto extends createZodDto(UpdateExpenseBodySchema) {}
