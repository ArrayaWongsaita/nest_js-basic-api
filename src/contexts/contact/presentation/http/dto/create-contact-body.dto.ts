import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateContactBodySchema = z
  .object({
    firstName: z
      .string()
      .min(1)
      .meta({
        description: 'First name of the contact.',
        example: 'John',
      }),
    lastName: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description: 'Optional last name of the contact.',
        example: 'Doe',
      }),
    email: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description: 'Optional email address of the contact.',
        example: 'john@example.com',
      }),
    phone: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description: 'Optional phone number of the contact.',
        example: '+66-81-234-5678',
      }),
    company: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description: 'Optional company name associated with the contact.',
        example: 'Acme Corp',
      }),
    address: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description: 'Optional physical address of the contact.',
        example: '123 Main St, Bangkok 10100',
      }),
  })
  .meta({ id: 'CreateContactBody' });

export class CreateContactBodyDto extends createZodDto(
  CreateContactBodySchema,
) {}
