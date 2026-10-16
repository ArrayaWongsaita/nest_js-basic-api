import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { buildSuccessResponseSchema } from '../../../../../shared/presentation/http/response/http-response-envelope';
import { AdminUserListMetaSchema } from './admin-users.dto';

export const AdminAuditEntrySchema = z
  .object({
    id: z.string().min(1).meta({
      description: 'Unique identifier of the audit entry.',
      example: '2f0c6c6e-6c1e-4e0e-9a5b-6c2a1d3f4b5a',
    }),
    actorUserId: z.string().min(1).meta({
      description: 'Identifier of the admin who attempted the action.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    action: z.string().min(1).meta({
      description: 'Dotted action name.',
      example: 'user.status_changed',
    }),
    targetType: z.string().min(1).meta({
      description: 'Kind of thing the action targeted.',
      example: 'user',
    }),
    targetId: z.string().nullable().meta({
      description: 'Identifier of the target, or null when there is none.',
      example: '1b3f0a52-6a3e-4a67-9f0c-0d6c3d2a9a11',
    }),
    outcome: z.enum(['success', 'rejected']).meta({
      description: 'Whether the action was applied or rejected by a rule.',
      example: 'success',
    }),
    details: z
      .record(z.string(), z.unknown())
      .nullable()
      .meta({
        description:
          'Small payload describing the action. Never contains secrets. Rejected entries carry a reason.',
        example: { isActive: false },
      }),
    createdAt: z.string().datetime({ offset: true }).meta({
      description: 'Timestamp when the entry was recorded.',
      example: '2026-05-26T08:30:00.000Z',
    }),
  })
  .meta({ id: 'AdminAuditEntry' });

export class AdminAuditEntryResponseDto extends createZodDto(
  AdminAuditEntrySchema,
) {}

export const AdminAuditEntriesHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminAuditEntriesHttpResponse',
  dataSchema: z.array(AdminAuditEntrySchema).meta({
    description: 'Paginated audit entries, newest first.',
  }),
  metaSchema: AdminUserListMetaSchema,
});

export class AdminAuditEntriesHttpResponseDto extends createZodDto(
  AdminAuditEntriesHttpResponseSchema,
) {}

export const ListAdminAuditEntriesQuerySchema = z
  .object({
    actorUserId: z.string().trim().min(1).optional().meta({
      description: 'Only entries recorded for this acting admin.',
      example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
    }),
    action: z.string().trim().min(1).optional().meta({
      description: 'Only entries with this exact action name.',
      example: 'user.status_changed',
    }),
    targetType: z.string().trim().min(1).optional().meta({
      description: 'Only entries with this target type.',
      example: 'user',
    }),
    targetId: z.string().trim().min(1).optional().meta({
      description: 'Only entries for this target identifier.',
      example: '1b3f0a52-6a3e-4a67-9f0c-0d6c3d2a9a11',
    }),
    from: z.string().datetime({ offset: true }).optional().meta({
      description: 'Inclusive lower bound on the entry timestamp (ISO 8601).',
      example: '2026-05-01T00:00:00.000Z',
    }),
    to: z.string().datetime({ offset: true }).optional().meta({
      description: 'Inclusive upper bound on the entry timestamp (ISO 8601).',
      example: '2026-05-31T23:59:59.999Z',
    }),
    page: z.coerce.number().int().positive().default(1).meta({
      description: '1-based page number.',
      example: 1,
    }),
    limit: z.coerce.number().int().min(1).max(100).default(20).meta({
      description: 'Maximum number of entries to return.',
      example: 20,
    }),
  })
  .meta({ id: 'ListAdminAuditEntriesQuery' });

export class ListAdminAuditEntriesQueryDto extends createZodDto(
  ListAdminAuditEntriesQuerySchema,
) {}
