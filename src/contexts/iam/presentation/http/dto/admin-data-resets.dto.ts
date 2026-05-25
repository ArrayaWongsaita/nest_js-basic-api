import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { buildSuccessResponseSchema } from '../../../../../shared/presentation/http/response/http-response-envelope';

export const ResetScopeValues = ['user', 'global'] as const;
export const ResetDomainValues = ['iam', 'todo', 'all'] as const;

export const CreateAdminDataResetBodySchema = z.object({
  scope: z.enum(ResetScopeValues).meta({
    description: 'Reset scope for the maintenance action.',
    example: 'user',
  }),
  targetUserId: z.string().uuid().optional().meta({
    description: 'Required when scope is user.',
    example: '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1',
  }),
  domains: z.array(z.enum(ResetDomainValues)).min(1).meta({
    description: 'One or more reset domains, or all.',
    example: ['todo', 'iam'],
  }),
  mode: z.literal('reset_to_demo_baseline').meta({
    description: 'Reset strategy used by the system.',
    example: 'reset_to_demo_baseline',
  }),
  reason: z.string().trim().min(1).optional().meta({
    description: 'Optional audit-friendly reason for the reset.',
    example: 'Reset learner workspace after completing the lesson',
  }),
}).meta({ id: 'CreateAdminDataResetBody' });

export class CreateAdminDataResetBodyDto extends createZodDto(
  CreateAdminDataResetBodySchema,
) {}

export const ResetDomainResultSchema = z.object({
  domain: z.string().min(1).meta({
    description: 'Reset domain that was processed.',
    example: 'todo',
  }),
  deletedRecords: z.number().int().nonnegative().meta({
    description: 'Number of records deleted during the reset.',
    example: 12,
  }),
  preservedRecords: z.number().int().nonnegative().meta({
    description: 'Number of records intentionally preserved.',
    example: 1,
  }),
}).meta({ id: 'ResetDomainResult' });

export const AdminDataResetSchema = z.object({
  scope: z.enum(ResetScopeValues).meta({
    description: 'Reset scope that was executed.',
    example: 'global',
  }),
  targetUserId: z.string().uuid().nullable().meta({
    description: 'User identifier for user-scoped resets, otherwise null.',
    example: null,
  }),
  domains: z.array(z.string().min(1)).meta({
    description: 'Resolved domains that were reset.',
    example: ['todo', 'iam'],
  }),
  mode: z.literal('reset_to_demo_baseline').meta({
    description: 'Reset strategy that was executed.',
    example: 'reset_to_demo_baseline',
  }),
  reason: z.string().nullable().meta({
    description: 'Audit-friendly reason captured from the request.',
    example: 'Reset learner workspace after completing the lesson',
  }),
  domainResults: z.array(ResetDomainResultSchema).meta({
    description: 'Per-domain reset summary.',
  }),
  preservedSystemRecords: z.object({
    users: z.number().int().nonnegative().meta({
      description: 'Number of protected system users preserved.',
      example: 1,
    }),
    roles: z.number().int().nonnegative().meta({
      description: 'Number of protected system roles preserved.',
      example: 2,
    }),
    permissions: z.number().int().nonnegative().meta({
      description: 'Number of protected system permissions preserved.',
      example: 14,
    }),
  }).meta({ id: 'AdminDataResetPreservedSystemRecords' }),
  completedAt: z.string().datetime({ offset: true }).meta({
    description: 'Timestamp when the reset completed.',
    example: '2026-05-26T08:30:00.000Z',
  }),
}).meta({ id: 'AdminDataReset' });

export class AdminDataResetResponseDto extends createZodDto(
  AdminDataResetSchema,
) {}

export const AdminDataResetHttpResponseSchema = buildSuccessResponseSchema({
  id: 'AdminDataResetHttpResponse',
  dataSchema: AdminDataResetSchema,
});

export class AdminDataResetHttpResponseDto extends createZodDto(
  AdminDataResetHttpResponseSchema,
) {}
