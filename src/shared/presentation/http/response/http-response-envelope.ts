import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HttpErrorCodeValues = [
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INTERNAL_ERROR',
] as const;

export const HttpErrorCodeSchema = z.enum(HttpErrorCodeValues).meta({
  description: 'Stable application-level code that categorizes the HTTP error.',
  example: 'VALIDATION_ERROR',
});

export const HttpErrorDetailSchema = z
  .object({
    path: z.string().min(1).meta({
      description: 'Dot-separated field path associated with the validation issue.',
      example: 'password',
    }),
    code: z.string().min(1).meta({
      description: 'Machine-readable validation issue code.',
      example: 'too_small',
    }),
    message: z.string().min(1).meta({
      description: 'Human-readable explanation of the issue.',
      example: 'String must contain at least 8 character(s)',
    }),
  })
  .meta({ id: 'HttpErrorDetail' });

export const HttpErrorBodySchema = z
  .object({
    code: HttpErrorCodeSchema,
    message: z.string().min(1).meta({
      description: 'Human-readable error message.',
      example: 'Validation failed.',
    }),
    details: z.array(HttpErrorDetailSchema).optional().meta({
      description: 'Structured field issues when the request payload or params are invalid.',
    }),
  })
  .meta({ id: 'HttpErrorBody' });

export const HttpErrorResponseSchema = z
  .object({
    success: z.literal(false).meta({
      description: 'Indicates that the request failed.',
      example: false,
    }),
    error: HttpErrorBodySchema,
    path: z.string().min(1).meta({
      description: 'HTTP request path that produced the error.',
      example: '/users/8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1/todos?page=0',
    }),
    timestamp: z.string().datetime({ offset: true }).meta({
      description: 'Timestamp when the error response was generated.',
      example: '2026-05-26T08:30:00.000Z',
    }),
    statusCode: z.number().int().meta({
      description: 'HTTP status code returned by the server.',
      example: 400,
    }),
  })
  .meta({ id: 'HttpErrorResponse' });

export class HttpErrorResponseDto extends createZodDto(HttpErrorResponseSchema) {}

export function buildSuccessResponseSchema<
  TDataSchema extends z.ZodTypeAny,
  TMetaSchema extends z.ZodTypeAny | undefined = undefined,
>(options: {
  readonly id: string;
  readonly dataSchema: TDataSchema;
  readonly metaSchema?: TMetaSchema;
}) {
  const shape: Record<string, z.ZodTypeAny> = {
    success: z.literal(true).meta({
      description: 'Indicates that the request succeeded.',
      example: true,
    }),
    data: options.dataSchema,
  };

  if (options.metaSchema) {
    shape.meta = options.metaSchema;
  }

  return z.object(shape).meta({ id: options.id });
}

export type HttpSuccessResponse<TData, TMeta = never> = [TMeta] extends [never]
  ? {
      readonly success: true;
      readonly data: TData;
    }
  : {
      readonly success: true;
      readonly data: TData;
      readonly meta: TMeta;
    };

export function createSuccessResponse<TData>(
  data: TData,
): HttpSuccessResponse<TData>;
export function createSuccessResponse<TData, TMeta>(
  data: TData,
  meta: TMeta,
): HttpSuccessResponse<TData, TMeta>;
export function createSuccessResponse<TData, TMeta>(
  data: TData,
  meta?: TMeta,
) {
  if (meta === undefined) {
    return {
      success: true as const,
      data,
    };
  }

  return {
    success: true as const,
    data,
    meta,
  };
}
