import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { MovieListPaginationMetaSchema } from './movie-list-pagination-meta.dto';
import { MovieResponseSchema } from './movie-response.dto';

export const ListUserMoviesResponseSchema = z
  .object({
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the returned movies.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    items: z
      .array(MovieResponseSchema)
      .meta({
        description: 'Movies owned by the specified user.',
        example: [
          {
            id: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
            userId: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
            title: 'Inception',
            director: 'Christopher Nolan',
            genre: 'Sci-Fi',
            releaseYear: 2010,
            status: 'TO_WATCH',
            createdAt: '2026-05-25T14:30:00.000Z',
            updatedAt: '2026-05-25T14:30:00.000Z',
          },
        ],
      }),
  })
  .meta({ id: 'ListUserMoviesResponse' });

export class ListUserMoviesResponseDto extends createZodDto(
  ListUserMoviesResponseSchema,
) {}

export const ListUserMoviesHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ListUserMoviesHttpResponse',
  dataSchema: ListUserMoviesResponseSchema,
  metaSchema: MovieListPaginationMetaSchema.meta({
    description: 'Pagination metadata for the current movie list response page.',
    example: {
      page: 1,
      limit: 10,
      totalItems: 24,
      totalPages: 3,
    },
  }),
});

export class ListUserMoviesHttpResponseDto extends createZodDto(
  ListUserMoviesHttpResponseSchema,
) {}
