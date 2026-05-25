import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse as SwaggerApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { HttpErrorResponseDto } from '../../../shared/presentation/http/response/http-response-envelope';

type ErrorResponseDecorator = MethodDecorator & ClassDecorator;
type HttpErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

type HttpErrorDetailExample = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

type HttpErrorResponseExample = {
  readonly success: false;
  readonly error: {
    readonly code: HttpErrorCode;
    readonly message: string;
    readonly details?: readonly HttpErrorDetailExample[];
  };
  readonly path: string;
  readonly timestamp: string;
  readonly statusCode: number;
};

export function ApiBadRequestErrorResponse(
  description: string,
): ErrorResponseDecorator {
  return createErrorResponseDecorator(
    HttpStatus.BAD_REQUEST,
    description,
    createValidationErrorExample(),
    ApiBadRequestResponse,
  );
}

export function ApiUnauthorizedErrorResponse(
  description: string,
): ErrorResponseDecorator {
  return createErrorResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    description,
    createErrorExample(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', description),
    ApiUnauthorizedResponse,
  );
}

export function ApiForbiddenErrorResponse(
  description: string,
): ErrorResponseDecorator {
  return createErrorResponseDecorator(
    HttpStatus.FORBIDDEN,
    description,
    createErrorExample(HttpStatus.FORBIDDEN, 'FORBIDDEN', description),
    ApiForbiddenResponse,
  );
}

export function ApiNotFoundErrorResponse(
  description: string,
): ErrorResponseDecorator {
  return createErrorResponseDecorator(
    HttpStatus.NOT_FOUND,
    description,
    createErrorExample(HttpStatus.NOT_FOUND, 'NOT_FOUND', description),
    ApiNotFoundResponse,
  );
}

export function ApiConflictErrorResponse(
  description: string,
): ErrorResponseDecorator {
  return createErrorResponseDecorator(
    HttpStatus.CONFLICT,
    description,
    createErrorExample(HttpStatus.CONFLICT, 'CONFLICT', description),
    ApiConflictResponse,
  );
}

export function ApiInternalServerErrorResponse(): ErrorResponseDecorator {
  return createErrorResponseDecorator(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'The server could not complete the request.',
    createErrorExample(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR',
      'Internal server error.',
    ),
    SwaggerApiInternalServerErrorResponse,
  );
}

function createErrorResponseDecorator(
  statusCode: HttpStatus,
  description: string,
  example: HttpErrorResponseExample,
  decoratorFactory: (options: {
    readonly description: string;
    readonly content: {
      readonly 'application/json': {
        readonly schema: {
          readonly $ref: string;
        };
        readonly example: HttpErrorResponseExample;
      };
    };
  }) => MethodDecorator & ClassDecorator,
): ErrorResponseDecorator {
  return applyDecorators(
    ApiExtraModels(HttpErrorResponseDto),
    decoratorFactory({
      description,
      content: {
        'application/json': {
          schema: {
            $ref: getSchemaPath(HttpErrorResponseDto),
          },
          example,
        },
      },
    }),
  );
}

function createValidationErrorExample(): HttpErrorResponseExample {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      details: [
        {
          path: 'password',
          code: 'too_small',
          message: 'String must contain at least 8 character(s)',
        },
      ],
    },
    path: '/resource',
    timestamp: '2026-05-26T08:30:00.000Z',
    statusCode: HttpStatus.BAD_REQUEST,
  };
}

function createErrorExample(
  statusCode: HttpStatus,
  code: HttpErrorCode,
  message: string,
): HttpErrorResponseExample {
  return {
    success: false,
    error: {
      code,
      message,
    },
    path: '/resource',
    timestamp: '2026-05-26T08:30:00.000Z',
    statusCode,
  };
}
