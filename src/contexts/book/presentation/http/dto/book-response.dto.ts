import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const BookResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: 'Unique identifier of the book.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the book.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    title: z.string().meta({
      description: 'Title of the book.',
      example: 'Clean Code',
    }),
    author: z
      .string()
      .meta({
        description: 'Author of the book.',
        example: 'Robert C. Martin',
      }),
    genre: z
      .string()
      .nullable()
      .meta({
        description: 'Optional genre of the book.',
        example: 'Software Engineering',
      }),
    publishedYear: z
      .number()
      .int()
      .nullable()
      .meta({
        description: 'Optional year the book was published.',
        example: 2008,
      }),
    status: z
      .string()
      .meta({
        description: 'Reading status of the book.',
        example: 'TO_READ',
      }),
    createdAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the book was created.',
        example: '2026-05-25T14:30:00.000Z',
      }),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the book was last updated.',
        example: '2026-05-25T14:30:00.000Z',
      }),
  })
  .meta({ id: 'BookResponse' });

export class BookResponseDto extends createZodDto(BookResponseSchema) {}

export const BookHttpResponseSchema = buildSuccessResponseSchema({
  id: 'BookHttpResponse',
  dataSchema: BookResponseSchema,
});

export class BookHttpResponseDto extends createZodDto(BookHttpResponseSchema) {}
