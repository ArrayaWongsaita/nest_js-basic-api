import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { TodoListPaginationMetaSchema } from './todo-list-pagination-meta.dto';
import { TodoResponseSchema } from './todo-response.dto';

export const ListUserTodosResponseSchema = z
  .object({
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the returned todo items.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    items: z
      .array(TodoResponseSchema)
      .meta({
        description: 'Todo items owned by the specified user.',
        example: [
          {
            id: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
            userId: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
            title: 'Write API docs',
            description: 'Describe every field in Swagger.',
            isCompleted: false,
            dueDate: '2026-06-01T09:00:00.000Z',
            createdAt: '2026-05-25T14:30:00.000Z',
            updatedAt: '2026-05-25T14:30:00.000Z',
          },
        ],
      }),
  })
  .meta({ id: 'ListUserTodosResponse' });

export class ListUserTodosResponseDto extends createZodDto(
  ListUserTodosResponseSchema,
) {}

export const ListUserTodosHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ListUserTodosHttpResponse',
  dataSchema: ListUserTodosResponseSchema,
  metaSchema: TodoListPaginationMetaSchema.meta({
    description: 'Pagination metadata for the current todo list response page.',
    example: {
      page: 1,
      limit: 10,
      totalItems: 24,
      totalPages: 3,
    },
  }),
});

export class ListUserTodosHttpResponseDto extends createZodDto(
  ListUserTodosHttpResponseSchema,
) {}
