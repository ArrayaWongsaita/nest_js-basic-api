import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  ADMIN_ROLE_NAME,
  STUDENT_ROLE_NAME,
} from '../../../domain/constants/role-name.constants';

export const RegisterUserBodySchema = z
  .object({
    email: z
      .string()
      .email()
      .meta({
        description: 'Email address used as the unique identity for the user.',
        example: 'architect@example.com',
      }),
    password: z
      .string()
      .min(12)
      .meta({
        description:
          'Plain-text password with a minimum length of 12 characters.',
        example: 'strong-password-123',
      }),
    roles: z
      .array(
        z.enum([ADMIN_ROLE_NAME, STUDENT_ROLE_NAME]).meta({
          description: 'Role name assigned to the user during administrative onboarding.',
          example: STUDENT_ROLE_NAME,
        }),
      )
      .default([])
      .meta({
        description:
          'Role names granted to the user during administrative onboarding. When omitted, the user receives the student role.',
        example: [STUDENT_ROLE_NAME],
      }),
  })
  .meta({ id: 'RegisterUserBody' });

export class RegisterUserBodyDto extends createZodDto(RegisterUserBodySchema) {}
