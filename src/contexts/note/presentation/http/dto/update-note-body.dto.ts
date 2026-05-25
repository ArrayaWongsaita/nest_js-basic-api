import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateNoteBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated short title for the note.',
        example: 'Updated meeting notes',
      }),
    content: z
      .string()
      .min(1)
      .optional()
      .meta({
        description: 'Updated body content of the note.',
        example: 'Updated discussion points from the meeting.',
      }),
  })
  .refine(
    (value) => value.title !== undefined || value.content !== undefined,
    {
      message: 'At least one field must be provided.',
    },
  )
  .meta({ id: 'UpdateNoteBody' });

export class UpdateNoteBodyDto extends createZodDto(UpdateNoteBodySchema) {}
