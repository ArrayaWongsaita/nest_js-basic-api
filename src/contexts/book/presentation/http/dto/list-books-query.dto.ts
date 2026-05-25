import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListBooksQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1)
      .optional()
      .meta({
        description:
          'Optional case-insensitive text filter applied to the book title, author, and genre.',
        example: 'clean',
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
  .meta({ id: 'ListBooksQuery' });

export class ListBooksQueryDto extends createZodDto(ListBooksQuerySchema) {}
