import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateTodoBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated short title for the todo item.',
        example: 'Publish API docs',
      }),
    description: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated optional longer description. Use null to clear the current description.',
        example: 'Publish the Todo dual-mode API documentation.',
      }),
    isCompleted: z
      .boolean()
      .optional()
      .meta({
        description: 'Updated completion state of the todo item.',
        example: true,
      }),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated due date in ISO 8601 format with timezone offset. Use null to clear the current due date.',
        example: '2026-06-03T09:00:00.000Z',
      }),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.isCompleted !== undefined ||
      value.dueDate !== undefined,
    {
      message: 'At least one field must be provided.',
    },
  )
  .meta({ id: 'UpdateTodoBody' });

export class UpdateTodoBodyDto extends createZodDto(UpdateTodoBodySchema) {}
