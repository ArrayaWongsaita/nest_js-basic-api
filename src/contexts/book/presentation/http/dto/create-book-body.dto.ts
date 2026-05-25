import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateBookBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .meta({
        description: 'Title of the book.',
        example: 'Clean Code',
      }),
    author: z
      .string()
      .min(1)
      .meta({
        description: 'Author of the book.',
        example: 'Robert C. Martin',
      }),
    genre: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Optional genre of the book.',
        example: 'Software Engineering',
      }),
    publishedYear: z
      .number()
      .int()
      .min(0)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description: 'Optional year the book was published.',
        example: 2008,
      }),
  })
  .meta({ id: 'CreateBookBody' });

export class CreateBookBodyDto extends createZodDto(CreateBookBodySchema) {}
