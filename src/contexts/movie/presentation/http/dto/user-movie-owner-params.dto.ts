import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserMovieOwnerParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Unique identifier of the user who owns the movies.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
  })
  .meta({ id: 'UserMovieOwnerParams' });

export class UserMovieOwnerParamsDto extends createZodDto(
  UserMovieOwnerParamsSchema,
) {}
