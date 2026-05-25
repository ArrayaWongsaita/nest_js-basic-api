import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const NoteRouteParamsSchema = z
  .object({
    noteId: z.string().uuid().meta({
      description: 'Unique identifier of the note.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'NoteRouteParams' });

export class NoteRouteParamsDto extends createZodDto(NoteRouteParamsSchema) {}
