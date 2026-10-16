import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminTodoOwnerRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the todo items.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
  })
  .meta({ id: 'AdminTodoOwnerRouteParams' });

export const AdminUserTodoRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the todo item.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    todoId: z.string().uuid().meta({
      description: 'Unique identifier of the todo item.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'AdminUserTodoRouteParams' });

export class AdminTodoOwnerRouteParamsDto extends createZodDto(
  AdminTodoOwnerRouteParamsSchema,
) {}
export class AdminUserTodoRouteParamsDto extends createZodDto(
  AdminUserTodoRouteParamsSchema,
) {}
