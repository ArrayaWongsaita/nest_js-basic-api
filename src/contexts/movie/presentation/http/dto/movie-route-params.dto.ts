import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MovieRouteParamsSchema = z
  .object({
    movieId: z.string().uuid().meta({
      description: 'Unique identifier of the movie.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'MovieRouteParams' });

export class MovieRouteParamsDto extends createZodDto(MovieRouteParamsSchema) {}
