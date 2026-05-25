import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateMovieBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated title for the movie.',
        example: 'The Dark Knight',
      }),
    director: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated director name. Use null to clear the current value.',
        example: 'Christopher Nolan',
      }),
    genre: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated genre. Use null to clear the current value.',
        example: 'Action',
      }),
    releaseYear: z
      .number()
      .int()
      .min(0)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated release year. Use null to clear the current value.',
        example: 2008,
      }),
    status: z
      .enum(['TO_WATCH', 'WATCHING', 'WATCHED'])
      .optional()
      .meta({
        description:
          'Updated watch status of the movie.',
        example: 'WATCHED',
      }),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.director !== undefined ||
      value.genre !== undefined ||
      value.releaseYear !== undefined ||
      value.status !== undefined,
    {
      message: 'At least one field must be provided.',
    },
  )
  .meta({ id: 'UpdateMovieBody' });

export class UpdateMovieBodyDto extends createZodDto(UpdateMovieBodySchema) {}
