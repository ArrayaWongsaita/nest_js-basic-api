import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const MovieResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: 'Unique identifier of the movie.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the movie.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    title: z.string().meta({
      description: 'Title of the movie.',
      example: 'Inception',
    }),
    director: z
      .string()
      .nullable()
      .meta({
        description: 'Director of the movie.',
        example: 'Christopher Nolan',
      }),
    genre: z
      .string()
      .nullable()
      .meta({
        description: 'Genre of the movie.',
        example: 'Sci-Fi',
      }),
    releaseYear: z
      .number()
      .int()
      .nullable()
      .meta({
        description: 'Release year of the movie.',
        example: 2010,
      }),
    status: z
      .enum(['TO_WATCH', 'WATCHING', 'WATCHED'])
      .meta({
        description: 'Watch status of the movie.',
        example: 'TO_WATCH',
      }),
    createdAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the movie was created.',
        example: '2026-05-25T14:30:00.000Z',
      }),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the movie was last updated.',
        example: '2026-05-25T14:30:00.000Z',
      }),
  })
  .meta({ id: 'MovieResponse' });

export class MovieResponseDto extends createZodDto(MovieResponseSchema) {}

export const MovieHttpResponseSchema = buildSuccessResponseSchema({
  id: 'MovieHttpResponse',
  dataSchema: MovieResponseSchema,
});

export class MovieHttpResponseDto extends createZodDto(MovieHttpResponseSchema) {}
