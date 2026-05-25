import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateExpenseBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .meta({
        description: 'Short title that summarizes the transaction.',
        example: 'Grocery shopping',
      }),
    amount: z
      .number()
      .positive()
      .meta({
        description: 'Transaction amount. Must be a positive number.',
        example: 29.99,
      }),
    type: z
      .enum(['INCOME', 'EXPENSE'])
      .meta({
        description: 'Transaction type: INCOME or EXPENSE.',
        example: 'EXPENSE',
      }),
    note: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Optional note that adds detail to the transaction.',
        example: 'Weekly groceries at the supermarket.',
      }),
    transactionDate: z
      .string()
      .datetime({ offset: true })
      .meta({
        description:
          'Date of the transaction in ISO 8601 format with timezone offset.',
        example: '2026-05-25T14:30:00.000Z',
      }),
  })
  .meta({ id: 'CreateExpenseBody' });

export class CreateExpenseBodyDto extends createZodDto(CreateExpenseBodySchema) {}
