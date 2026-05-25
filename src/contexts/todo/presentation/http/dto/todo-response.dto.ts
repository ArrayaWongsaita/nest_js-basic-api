import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const TodoResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: 'Unique identifier of the todo item.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the todo item.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    title: z.string().meta({
      description: 'Short title of the todo item.',
      example: 'Write API docs',
    }),
    description: z
      .string()
      .nullable()
      .meta({
        description: 'Optional longer description stored for the todo item.',
        example: 'Describe every field in Swagger.',
      }),
    isCompleted: z
      .boolean()
      .meta({
        description: 'Completion state of the todo item.',
        example: false,
      }),
    dueDate: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .meta({
        description:
          'Optional due date stored for the todo item in ISO 8601 format.',
        example: '2026-06-01T09:00:00.000Z',
      }),
    createdAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the todo item was created.',
        example: '2026-05-25T14:30:00.000Z',
      }),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the todo item was last updated.',
        example: '2026-05-25T14:30:00.000Z',
      }),
  })
  .meta({ id: 'TodoResponse' });

export class TodoResponseDto extends createZodDto(TodoResponseSchema) {}

export const TodoHttpResponseSchema = buildSuccessResponseSchema({
  id: 'TodoHttpResponse',
  dataSchema: TodoResponseSchema,
});

export class TodoHttpResponseDto extends createZodDto(TodoHttpResponseSchema) {}
