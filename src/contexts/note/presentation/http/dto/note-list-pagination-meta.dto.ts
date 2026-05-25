import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const NoteListPaginationMetaSchema = z
  .object({
    page: z.number().int().meta({
      description: 'Current 1-based page number returned by the list query.',
      example: 1,
    }),
    limit: z.number().int().meta({
      description: 'Maximum number of items included in the current page.',
      example: 10,
    }),
    totalItems: z.number().int().meta({
      description: 'Total number of notes that matched the active filters.',
      example: 24,
    }),
    totalPages: z.number().int().meta({
      description:
        'Total number of pages available for the active filters and page size.',
      example: 3,
    }),
  })
  .meta({ id: 'NoteListPaginationMeta' });

export class NoteListPaginationMetaDto extends createZodDto(
  NoteListPaginationMetaSchema,
) {}
