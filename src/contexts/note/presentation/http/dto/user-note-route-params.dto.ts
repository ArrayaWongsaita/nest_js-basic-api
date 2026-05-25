import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserNoteRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Unique identifier of the user who owns the note.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    noteId: z.string().uuid().meta({
      description: 'Unique identifier of the note.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'UserNoteRouteParams' });

export class UserNoteRouteParamsDto extends createZodDto(
  UserNoteRouteParamsSchema,
) {}
