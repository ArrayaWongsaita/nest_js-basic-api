import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTodoBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .meta({
        description: 'Short title that summarizes the todo item.',
        example: 'Write API docs',
      }),
    description: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Optional longer description that adds detail to the todo item.',
        example: 'Document the authenticated Todo endpoints.',
      }),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Optional due date in ISO 8601 format with timezone offset.',
        example: '2026-06-01T09:00:00.000Z',
      }),
  })
  .meta({ id: 'CreateTodoBody' });

export class CreateTodoBodyDto extends createZodDto(CreateTodoBodySchema) {}
