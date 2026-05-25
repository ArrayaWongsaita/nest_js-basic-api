import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ZodSerializationException,
  ZodValidationException,
} from 'nestjs-zod';
import { ZodError } from 'zod';
import {
  HttpErrorCodeValues,
} from '../response/http-response-envelope';

type HttpErrorCode = (typeof HttpErrorCodeValues)[number];
type HttpErrorDetail = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

type HttpErrorResponseBody = {
  readonly success: false;
  readonly error: {
    readonly code: HttpErrorCode;
    readonly message: string;
    readonly details?: ReadonlyArray<HttpErrorDetail>;
  };
  readonly path: string;
  readonly timestamp: string;
  readonly statusCode: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<{
      status(code: number): {
        json(body: HttpErrorResponseBody): void;
      };
    }>();
    const request = context.getRequest<{ url: string }>();
    const statusCode = this.resolveStatusCode(exception);
    const errorPayload = this.resolveErrorPayload(exception, statusCode);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logServerError(exception, request.url);
    }

    response.status(statusCode).json({
      success: false,
      error: errorPayload,
      path: request.url,
      timestamp: new Date().toISOString(),
      statusCode,
    });
  }

  private resolveStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveErrorPayload(
    exception: unknown,
    statusCode: number,
  ): HttpErrorResponseBody['error'] {
    if (exception instanceof ZodValidationException) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        details: this.mapZodIssues(exception.getZodError()),
      };
    }

    if (exception instanceof ZodSerializationException) {
      return {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      };
    }

    if (exception instanceof HttpException) {
      return {
        code: this.mapStatusCodeToErrorCode(statusCode),
        message: this.resolveHttpExceptionMessage(exception, statusCode),
        details: this.resolveHttpExceptionDetails(exception),
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.',
    };
  }

  private mapStatusCodeToErrorCode(statusCode: number): HttpErrorCode {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'INTERNAL_ERROR';
    }
  }

  private resolveHttpExceptionMessage(
    exception: HttpException,
    statusCode: number,
  ): string {
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error.';
    }

    const exceptionResponse = exception.getResponse();

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message?: unknown }).message;

      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    if (typeof exception.message === 'string' && exception.message.length > 0) {
      return exception.message;
    }

    return this.getDefaultMessage(statusCode);
  }

  private resolveHttpExceptionDetails(
    exception: HttpException,
  ): HttpErrorResponseBody['error']['details'] {
    const exceptionResponse = exception.getResponse();

    if (
      typeof exceptionResponse !== 'object' ||
      exceptionResponse === null ||
      !('errors' in exceptionResponse)
    ) {
      return undefined;
    }

    const errors = (exceptionResponse as { errors?: unknown }).errors;

    if (!Array.isArray(errors)) {
      return undefined;
    }

    const details = errors.reduce<HttpErrorDetail[]>((accumulator, issue) => {
      accumulator.push(...this.mapUnknownIssue(issue));

      return accumulator;
    }, []);

    return details.length > 0 ? details : undefined;
  }

  private mapZodIssues(zodError: unknown): HttpErrorResponseBody['error']['details'] {
    if (!(zodError instanceof ZodError)) {
      return undefined;
    }

    return zodError.issues.map((issue) => ({
      path: issue.path.join('.'),
      code: issue.code,
      message: issue.message,
    }));
  }

  private mapUnknownIssue(issue: unknown): HttpErrorDetail[] {
    if (typeof issue !== 'object' || issue === null) {
      return [];
    }

    const path = 'path' in issue ? (issue as { path?: unknown }).path : undefined;
    const code = 'code' in issue ? (issue as { code?: unknown }).code : undefined;
    const message =
      'message' in issue ? (issue as { message?: unknown }).message : undefined;

    return [
      {
        path: Array.isArray(path)
          ? path.map(String).join('.')
          : typeof path === 'string'
            ? path
            : 'request',
        code: typeof code === 'string' ? code : 'invalid',
        message: typeof message === 'string' ? message : 'Invalid request.',
      },
    ];
  }

  private getDefaultMessage(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad request.';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized.';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden.';
      case HttpStatus.NOT_FOUND:
        return 'Not found.';
      case HttpStatus.CONFLICT:
        return 'Conflict.';
      default:
        return 'Internal server error.';
    }
  }

  private logServerError(exception: unknown, path: string): void {
    const trace = exception instanceof Error ? exception.stack : String(exception);

    this.logger.error(`HTTP request failed for ${path}`, trace);
  }
}
