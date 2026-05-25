import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const CurrentUserSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Unique identifier of the authenticated IAM user.',
      example: '6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31',
    }),
    email: z.string().email().meta({
      description: 'Email address assigned to the authenticated IAM user.',
      example: 'architect@example.com',
    }),
    roles: z.array(z.string().min(1)).meta({
      description: 'Role names granted to the authenticated user.',
      example: ['student'],
    }),
    permissions: z.array(z.string().min(1)).meta({
      description: 'Permission names granted to the authenticated user.',
      example: ['todo.create_own', 'todo.read_own'],
    }),
  })
  .meta({ id: 'CurrentUser' });

export class CurrentUserResponseDto extends createZodDto(CurrentUserSchema) {}

export const CurrentUserHttpResponseSchema = buildSuccessResponseSchema({
  id: 'CurrentUserHttpResponse',
  dataSchema: CurrentUserSchema,
});

export class CurrentUserHttpResponseDto extends createZodDto(
  CurrentUserHttpResponseSchema,
) {}
