import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { ExpenseListPaginationMetaSchema } from './expense-list-pagination-meta.dto';
import { ExpenseResponseSchema } from './expense-response.dto';

export const ListUserExpensesResponseSchema = z
  .object({
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the returned transactions.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    items: z
      .array(ExpenseResponseSchema)
      .meta({
        description: 'Transactions owned by the specified user.',
        example: [
          {
            id: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
            userId: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
            title: 'Grocery shopping',
            amount: 29.99,
            type: 'EXPENSE',
            note: 'Weekly groceries at the supermarket.',
            transactionDate: '2026-05-25T14:30:00.000Z',
            createdAt: '2026-05-25T14:30:00.000Z',
            updatedAt: '2026-05-25T14:30:00.000Z',
          },
        ],
      }),
  })
  .meta({ id: 'ListUserExpensesResponse' });

export class ListUserExpensesResponseDto extends createZodDto(
  ListUserExpensesResponseSchema,
) {}

export const ListUserExpensesHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ListUserExpensesHttpResponse',
  dataSchema: ListUserExpensesResponseSchema,
  metaSchema: ExpenseListPaginationMetaSchema.meta({
    description: 'Pagination metadata for the current transaction list response page.',
    example: {
      page: 1,
      limit: 10,
      totalItems: 24,
      totalPages: 3,
    },
  }),
});

export class ListUserExpensesHttpResponseDto extends createZodDto(
  ListUserExpensesHttpResponseSchema,
) {}
