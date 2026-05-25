import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const NoteResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: 'Unique identifier of the note.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
    userId: z
      .string()
      .uuid()
      .meta({
        description: 'Identifier of the user who owns the note.',
        example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
      }),
    title: z.string().meta({
      description: 'Short title of the note.',
      example: 'Meeting notes',
    }),
    content: z
      .string()
      .meta({
        description: 'Body content of the note.',
        example: 'Discussed the new API design with the team.',
      }),
    createdAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the note was created.',
        example: '2026-05-25T14:30:00.000Z',
      }),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .meta({
        description: 'Timestamp when the note was last updated.',
        example: '2026-05-25T14:30:00.000Z',
      }),
  })
  .meta({ id: 'NoteResponse' });

export class NoteResponseDto extends createZodDto(NoteResponseSchema) {}

export const NoteHttpResponseSchema = buildSuccessResponseSchema({
  id: 'NoteHttpResponse',
  dataSchema: NoteResponseSchema,
});

export class NoteHttpResponseDto extends createZodDto(NoteHttpResponseSchema) {}
