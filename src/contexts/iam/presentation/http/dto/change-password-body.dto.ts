import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ChangePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).meta({
      description: 'The password the user currently signs in with.',
      example: 'current-password-123',
    }),
    newPassword: z.string().min(1).meta({
      description:
        'The new password. Must satisfy the same strength rules as registration.',
      example: 'a-new-strong-password-456',
    }),
  })
  .meta({ id: 'ChangePasswordBody' });

export class ChangePasswordBodyDto extends createZodDto(
  ChangePasswordBodySchema,
) {}
