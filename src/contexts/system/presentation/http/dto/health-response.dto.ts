import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  buildSuccessResponseSchema,
} from '../../../../../shared/presentation/http/response/http-response-envelope';

export const HealthResponseSchema = z
  .object({
    status: z.literal('ok').meta({
      description: 'Current liveness state of the HTTP API.',
      example: 'ok',
    }),
    service: z.string().min(1).meta({
      description: 'Service identifier for the current HTTP API process.',
      example: 'api',
    }),
    timestamp: z.string().datetime({ offset: true }).meta({
      description: 'Timestamp when the health snapshot was generated.',
      example: '2026-05-26T08:30:00.000Z',
    }),
  })
  .meta({ id: 'HealthResponse' });

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}

export const HealthHttpResponseSchema = buildSuccessResponseSchema({
  id: 'HealthHttpResponse',
  dataSchema: HealthResponseSchema,
});

export class HealthHttpResponseDto extends createZodDto(
  HealthHttpResponseSchema,
) {}
