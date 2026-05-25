import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const ContactResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: 'Unique identifier of the contact.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the contact.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    firstName: z.string().meta({
      description: 'First name of the contact.',
      example: 'John',
    }),
    lastName: z
      .string()
      .nullable()
      .meta({
        description: 'Optional last name of the contact.',
        example: 'Doe',
      }),
    email: z
      .string()
      .nullable()
      .meta({
        description: 'Optional email address of the contact.',
        example: 'john@example.com',
      }),
    phone: z
      .string()
      .nullable()
      .meta({
        description: 'Optional phone number of the contact.',
        example: '+66-81-234-5678',
      }),
    company: z
      .string()
      .nullable()
      .meta({
        description: 'Optional company name associated with the contact.',
        example: 'Acme Corp',
      }),
    address: z
      .string()
      .nullable()
      .meta({
        description: 'Optional physical address of the contact.',
        example: '123 Main St, Bangkok 10100',
      }),
    createdAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the contact was created.',
        example: '2026-05-25T14:30:00.000Z',
      }),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the contact was last updated.',
        example: '2026-05-25T14:30:00.000Z',
      }),
  })
  .meta({ id: 'ContactResponse' });

export class ContactResponseDto extends createZodDto(ContactResponseSchema) {}

export const ContactHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ContactHttpResponse',
  dataSchema: ContactResponseSchema,
});

export class ContactHttpResponseDto extends createZodDto(
  ContactHttpResponseSchema,
) {}
