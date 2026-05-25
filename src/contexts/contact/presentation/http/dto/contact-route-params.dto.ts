import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ContactRouteParamsSchema = z
  .object({
    contactId: z.string().uuid().meta({
      description: 'Unique identifier of the contact.',
      example: '42d7e12c-1e63-4fc6-a1a8-9779fd7f735d',
    }),
  })
  .meta({ id: 'ContactRouteParams' });

export class ContactRouteParamsDto extends createZodDto(
  ContactRouteParamsSchema,
) {}
