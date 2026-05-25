import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import { NoteListPaginationMetaSchema } from './note-list-pagination-meta.dto';
import { NoteResponseSchema } from './note-response.dto';

export const ListUserNotesResponseSchema = z
  .object({
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the returned notes.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    items: z
      .array(NoteResponseSchema)
      .meta({
        description: 'Notes owned by the specified user.',
        example: [
          {
            id: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
            userId: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
            title: 'Meeting notes',
            content: 'Discussed the new API design with the team.',
            createdAt: '2026-05-25T14:30:00.000Z',
            updatedAt: '2026-05-25T14:30:00.000Z',
          },
        ],
      }),
  })
  .meta({ id: 'ListUserNotesResponse' });

export class ListUserNotesResponseDto extends createZodDto(
  ListUserNotesResponseSchema,
) {}

export const ListUserNotesHttpResponseSchema = buildSuccessResponseSchema({
  id: 'ListUserNotesHttpResponse',
  dataSchema: ListUserNotesResponseSchema,
  metaSchema: NoteListPaginationMetaSchema.meta({
    description: 'Pagination metadata for the current note list response page.',
    example: {
      page: 1,
      limit: 10,
      totalItems: 24,
      totalPages: 3,
    },
  }),
});

export class ListUserNotesHttpResponseDto extends createZodDto(
  ListUserNotesHttpResponseSchema,
) {}
