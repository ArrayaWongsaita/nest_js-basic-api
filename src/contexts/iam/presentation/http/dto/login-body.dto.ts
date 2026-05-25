import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginBodySchema = z
  .object({
    email: z.string().email().meta({
      description: 'Email address assigned to the IAM user.',
      example: 'architect@example.com',
    }),
    password: z.string().min(12).meta({
      description: 'Plain-text password supplied by the user during sign-in.',
      example: 'strong-password-123',
    }),
  })
  .meta({ id: 'LoginBody' });

export class LoginBodyDto extends createZodDto(LoginBodySchema) {}
