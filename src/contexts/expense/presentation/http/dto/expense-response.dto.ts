import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const ExpenseResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: 'Unique identifier of the transaction.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the transaction.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    title: z.string().meta({
      description: 'Short title of the transaction.',
      example: 'Grocery shopping',
    }),
    amount: z
      .number()
      .meta({
        description: 'Transaction amount.',
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
      .nullable()
      .meta({
        description: 'Optional note stored for the transaction.',
        example: 'Weekly groceries at the supermarket.',
      }),
    transactionDate: z
      .string()
      .datetime({ offset: true })
      .meta({
        description:
          'Date of the transaction in ISO 8601 format.',
        example: '2026-05-25T14:30:00.000Z',
      }),
    createdAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the transaction was created.',
        example: '2026-05-25T14:30:00.000Z',
      }),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the transaction was last updated.',
        example: '2026-05-25T14:30:00.000Z',
      }),
  })
  .meta({ id: 'ExpenseResponse' });

export class ExpenseResponseDto extends createZodDto(ExpenseResponseSchema) {}

export const ExpenseHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ExpenseHttpResponse',
  dataSchema: ExpenseResponseSchema,
});

export class ExpenseHttpResponseDto extends createZodDto(ExpenseHttpResponseSchema) {}
