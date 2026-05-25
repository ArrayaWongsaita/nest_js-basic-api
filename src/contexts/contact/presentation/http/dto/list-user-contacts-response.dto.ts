import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { ContactListPaginationMetaSchema } from './contact-list-pagination-meta.dto';
import { ContactResponseSchema } from './contact-response.dto';

export const ListUserContactsResponseSchema = z
  .object({
    userId: z
      .string()
      .uuid()
      .meta({
        description:
          'Identifier of the user who owns the returned contacts.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    items: z
      .array(ContactResponseSchema)
      .meta({
        description: 'Contacts owned by the specified user.',
        example: [
          {
            id: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
            userId: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+66-81-234-5678',
            company: 'Acme Corp',
            address: '123 Main St, Bangkok 10100',
            createdAt: '2026-05-25T14:30:00.000Z',
            updatedAt: '2026-05-25T14:30:00.000Z',
          },
        ],
      }),
  })
  .meta({ id: 'ListUserContactsResponse' });

export class ListUserContactsResponseDto extends createZodDto(
  ListUserContactsResponseSchema,
) {}

export const ListUserContactsHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ListUserContactsHttpResponse',
  dataSchema: ListUserContactsResponseSchema,
  metaSchema: ContactListPaginationMetaSchema.meta({
    description:
      'Pagination metadata for the current contact list response page.',
    example: {
      page: 1,
      limit: 10,
      totalItems: 24,
      totalPages: 3,
    },
  }),
});

export class ListUserContactsHttpResponseDto extends createZodDto(
  ListUserContactsHttpResponseSchema,
) {}
