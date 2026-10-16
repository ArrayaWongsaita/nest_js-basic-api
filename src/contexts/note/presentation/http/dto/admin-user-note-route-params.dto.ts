import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminNoteOwnerRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the notes.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
  })
  .meta({ id: 'AdminNoteOwnerRouteParams' });

export const AdminUserNoteRouteParamsSchema = z
  .object({
    userId: z.string().uuid().meta({
      description: 'Identifier of the user who owns the note.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    noteId: z.string().uuid().meta({
      description: 'Unique identifier of the note.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'AdminUserNoteRouteParams' });

export class AdminNoteOwnerRouteParamsDto extends createZodDto(
  AdminNoteOwnerRouteParamsSchema,
) {}
export class AdminUserNoteRouteParamsDto extends createZodDto(
  AdminUserNoteRouteParamsSchema,
) {}
