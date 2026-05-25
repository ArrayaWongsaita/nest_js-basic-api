import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const TodoBooleanQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}, z.boolean());

export const ListTodosQuerySchema = z
  .object({
    isCompleted: TodoBooleanQuerySchema.optional().meta({
      description:
        'Optional completion-state filter. Use true for completed items or false for pending items.',
      example: true,
    }),
    search: z
      .string()
      .trim()
      .min(1)
      .optional()
      .meta({
        description:
          'Optional case-insensitive text filter applied to the todo title and description.',
        example: 'lesson',
      }),
    page: z.coerce.number().int().min(1).default(1).meta({
      description:
        '1-based page number for paginated list responses. Defaults to 1.',
      example: 1,
    }),
    limit: z.coerce.number().int().min(1).max(100).default(10).meta({
      description:
        'Maximum number of items returned in one page. Defaults to 10 and cannot exceed 100.',
      example: 10,
    }),
  })
  .meta({ id: 'ListTodosQuery' });

export class ListTodosQueryDto extends createZodDto(ListTodosQuerySchema) {}
