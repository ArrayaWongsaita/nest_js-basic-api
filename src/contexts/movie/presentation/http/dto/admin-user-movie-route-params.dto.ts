import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminMovieOwnerRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the movies.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
  })
  .meta({ id: 'AdminMovieOwnerRouteParams' });

export const AdminUserMovieRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the movie.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    movieId: z.string().uuid().meta({
      description: 'Unique identifier of the movie.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'AdminUserMovieRouteParams' });

export class AdminMovieOwnerRouteParamsDto extends createZodDto(
  AdminMovieOwnerRouteParamsSchema,
) {}
export class AdminUserMovieRouteParamsDto extends createZodDto(
  AdminUserMovieRouteParamsSchema,
) {}
