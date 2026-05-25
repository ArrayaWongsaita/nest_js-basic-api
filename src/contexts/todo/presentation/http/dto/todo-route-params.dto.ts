import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TodoRouteParamsSchema = z
  .object({
    todoId: z.string().uuid().meta({
      description: 'Unique identifier of the todo item.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'TodoRouteParams' });

export class TodoRouteParamsDto extends createZodDto(TodoRouteParamsSchema) {}
