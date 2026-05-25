import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateNoteBodySchema = z
  .object({
    title: z
      .string()
      .min(1)
      .meta({
        description: 'Short title that summarizes the note.',
        example: 'Meeting notes',
      }),
    content: z
      .string()
      .min(1)
      .meta({
        description: 'Body content of the note.',
        example: 'Discussed the new API design with the team.',
      }),
  })
  .meta({ id: 'CreateNoteBody' });

export class CreateNoteBodyDto extends createZodDto(CreateNoteBodySchema) {}
