import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateBookBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated title of the book.',
        example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      }),
    author: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated author of the book.',
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
          'Updated genre of the book. Use null to clear the current genre.',
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
        description:
          'Updated year the book was published. Use null to clear the current published year.',
        example: 2008,
      }),
    status: z
      .enum(['TO_READ', 'READING', 'COMPLETED'])
      .optional()
      .meta({
        description: 'Updated reading status of the book.',
        example: 'READING',
      }),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.author !== undefined ||
      value.genre !== undefined ||
      value.publishedYear !== undefined ||
      value.status !== undefined,
    {
      message: 'At least one field must be provided.',
    },
  )
  .meta({ id: 'UpdateBookBody' });

export class UpdateBookBodyDto extends createZodDto(UpdateBookBodySchema) {}
