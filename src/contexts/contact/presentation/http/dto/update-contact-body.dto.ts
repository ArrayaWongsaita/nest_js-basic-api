import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateContactBodySchema = z
  .object({
    firstName: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated first name of the contact.',
        example: 'Jane',
      }),
    lastName: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated optional last name. Use null to clear the current last name.',
        example: 'Smith',
      }),
    email: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated optional email address. Use null to clear the current email.',
        example: 'jane@example.com',
      }),
    phone: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated optional phone number. Use null to clear the current phone.',
        example: '+66-81-999-9999',
      }),
    company: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated optional company name. Use null to clear the current company.',
        example: 'New Corp',
      }),
    address: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .meta({
        description:
          'Updated optional physical address. Use null to clear the current address.',
        example: '456 Side St, Chiang Mai 50200',
      }),
  })
  .refine(
    (value) =>
      value.firstName !== undefined ||
      value.lastName !== undefined ||
      value.email !== undefined ||
      value.phone !== undefined ||
      value.company !== undefined ||
      value.address !== undefined,
    {
      message: 'At least one field must be provided.',
    },
  )
  .meta({ id: 'UpdateContactBody' });

export class UpdateContactBodyDto extends createZodDto(
  UpdateContactBodySchema,
) {}
