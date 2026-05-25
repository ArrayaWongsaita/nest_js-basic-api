import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { CurrentUserSchema } from './current-user-response.dto';

export const AuthSessionResponseSchema = z
  .object({
    accessToken: z.string().meta({
      description: 'JWT access token used as a Bearer token on protected routes.',
      example:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTRmNGM1Ny01YTEyLTRjNmItYTlhNS05YjlhMmY4YjVjMzEiLCJlbWFpbCI6ImFyY2hpdGVjdEBleGFtcGxlLmNvbSIsInJvbGVzIjpbInN0dWRlbnQiXSwicGVybWlzc2lvbnMiOlsidG9kby5jcmVhdGVfb3duIiwidG9kby5yZWFkX293biJdLCJpYXQiOjE3NDgxNzkyMDAsImV4cCI6MTc0ODE4MDEwMH0.signature',
    }),
    tokenType: z.literal('Bearer').meta({
      description: 'Authorization scheme expected by protected endpoints.',
      example: 'Bearer',
    }),
    expiresInSeconds: z.number().int().positive().meta({
      description: 'Lifetime of the access token in seconds.',
      example: 900,
    }),
    user: CurrentUserSchema.meta({
      description:
        'Authenticated user profile snapshot embedded into the current session response.',
      example: {
        userId: '6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31',
        email: 'architect@example.com',
        roles: ['student'],
        permissions: ['todo.create_own', 'todo.read_own'],
      },
    }),
  })
  .meta({ id: 'AuthSessionResponse' });

export class AuthSessionResponseDto extends createZodDto(
  AuthSessionResponseSchema,
) {}

export const AuthSessionHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AuthSessionHttpResponse',
  dataSchema: AuthSessionResponseSchema,
});

export class AuthSessionHttpResponseDto extends createZodDto(
  AuthSessionHttpResponseSchema,
) {}
