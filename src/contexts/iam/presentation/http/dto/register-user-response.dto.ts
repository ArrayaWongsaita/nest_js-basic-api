import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const RegisterUserResponseSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Unique identifier of the registered user.',
      example: '6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31',
    }),
    email: z
      .string()
      .email()
      .meta({
        description: 'Email address stored for the registered user.',
        example: 'architect@example.com',
      }),
    roles: z
      .array(
        z.string().min(1).meta({
          description: 'Role name assigned to the user.',
          example: 'student',
        }),
      )
      .meta({
        description: 'Role names associated with the user after creation.',
        example: ['student'],
      }),
  })
  .meta({ id: 'RegisterUserResponse' });

export class RegisterUserResponseDto extends createZodDto(
  RegisterUserResponseSchema,
) {}

export const RegisterUserHttpResponseSchema = buildSuccessResponseSchema({
  id: 'RegisterUserHttpResponse',
  dataSchema: RegisterUserResponseSchema,
});

export class RegisterUserHttpResponseDto extends createZodDto(
  RegisterUserHttpResponseSchema,
) {}
