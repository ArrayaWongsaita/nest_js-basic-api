import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { buildSuccessResponseSchema } from '../../../../../shared/presentation/http/response/http-response-envelope';

export const AdminDemoUserSeedSchema = z.object({
  totalUsers: z.number().int().positive().meta({
    description: 'Number of demo student users reconciled by the seed operation.',
    example: 60,
  }),
  firstEmail: z.string().email().meta({
    description: 'First seeded student email in the deterministic range.',
    example: 'student1@mail.com',
  }),
  lastEmail: z.string().email().meta({
    description: 'Last seeded student email in the deterministic range.',
    example: 'student60@mail.com',
  }),
  roleName: z.string().min(1).meta({
    description: 'Canonical role assigned to every seeded demo student.',
    example: 'student',
  }),
  completedAt: z.string().datetime({ offset: true }).meta({
    description: 'Timestamp when the demo-user seed completed.',
    example: '2026-05-26T08:30:00.000Z',
  }),
}).meta({ id: 'AdminDemoUserSeed' });

export class AdminDemoUserSeedResponseDto extends createZodDto(
  AdminDemoUserSeedSchema,
) {}

export const AdminDemoUserSeedHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminDemoUserSeedHttpResponse',
  dataSchema: AdminDemoUserSeedSchema,
});

export class AdminDemoUserSeedHttpResponseDto extends createZodDto(
  AdminDemoUserSeedHttpResponseSchema,
) {}
