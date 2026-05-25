import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateMovieBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .meta({
        description: 'Title of the movie.',
        example: 'Inception',
      }),
    director: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Optional director name. Use null to leave it unspecified.',
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
          'Optional genre. Use null to leave it unspecified.',
        example: 'Sci-Fi',
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
          'Optional release year. Use null to leave it unspecified.',
        example: 2010,
      }),
  })
  .meta({ id: 'CreateMovieBody' });

export class CreateMovieBodyDto extends createZodDto(CreateMovieBodySchema) {}
