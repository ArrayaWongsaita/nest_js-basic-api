import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { BookListPaginationMetaSchema } from './book-list-pagination-meta.dto';
import { BookResponseSchema } from './book-response.dto';

export const ListUserBooksResponseSchema = z
  .object({
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the returned books.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    items: z
      .array(BookResponseSchema)
      .meta({
        description: 'Books owned by the specified user.',
        example: [
          {
            id: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
            userId: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
            title: 'Clean Code',
            author: 'Robert C. Martin',
            genre: 'Software Engineering',
            publishedYear: 2008,
            status: 'TO_READ',
            createdAt: '2026-05-25T14:30:00.000Z',
            updatedAt: '2026-05-25T14:30:00.000Z',
          },
        ],
      }),
  })
  .meta({ id: 'ListUserBooksResponse' });

export class ListUserBooksResponseDto extends createZodDto(
  ListUserBooksResponseSchema,
) {}

export const ListUserBooksHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ListUserBooksHttpResponse',
  dataSchema: ListUserBooksResponseSchema,
  metaSchema: BookListPaginationMetaSchema.meta({
    description: 'Pagination metadata for the current book list response page.',
    example: {
      page: 1,
      limit: 10,
      totalItems: 24,
      totalPages: 3,
    },
  }),
});

export class ListUserBooksHttpResponseDto extends createZodDto(
  ListUserBooksHttpResponseSchema,
) {}
