import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BookRouteParamsSchema = z
  .object({
    bookId: z.string().uuid().meta({
      description: 'Unique identifier of the book.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'BookRouteParams' });

export class BookRouteParamsDto extends createZodDto(BookRouteParamsSchema) {}
