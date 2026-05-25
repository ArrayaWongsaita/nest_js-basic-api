import {
  ArgumentsHost,
  ConflictException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { HttpExceptionFilter } from './http-exception.filter';

type MockResponse = {
  status: jest.MockedFunction<(statusCode: number) => MockResponse>;
  json: jest.MockedFunction<(body: unknown) => void>;
};

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('maps zod validation exceptions to a structured validation envelope', () => {
    const response = createMockResponse();
    const host = createArgumentsHost('/users/not-a-uuid/todos', response);
    const exception = new ZodValidationException(
      new z.ZodError([
        {
          code: 'invalid_format',
          format: 'uuid',
          path: ['userId'],
          message: 'Invalid UUID',
        },
      ]),
    );

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        path: '/users/not-a-uuid/todos',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed.',
          details: [
            {
              path: 'userId',
              code: 'invalid_format',
              message: 'Invalid UUID',
            },
          ],
        },
      }),
    );
  });

  it.each([
    [
      'unauthorized',
      new UnauthorizedException('Access token is required.'),
      401,
      'UNAUTHORIZED',
      'Access token is required.',
    ],
    [
      'not found',
      new NotFoundException('Todo was not found.'),
      404,
      'NOT_FOUND',
      'Todo was not found.',
    ],
    [
      'conflict',
      new ConflictException('User already exists.'),
      409,
      'CONFLICT',
      'User already exists.',
    ],
  ])(
    'maps %s exceptions to stable error codes',
    (_, exception, statusCode, code, message) => {
      const response = createMockResponse();
      const host = createArgumentsHost('/resource', response);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(statusCode);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode,
          error: {
            code,
            message,
          },
        }),
      );
    },
  );

  it('returns a generic internal error envelope for unexpected errors', () => {
    const response = createMockResponse();
    const host = createArgumentsHost('/health', response);

    filter.catch(new Error('Database password leaked here'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error.',
        },
      }),
    );
  });
});

function createArgumentsHost(
  url: string,
  response: MockResponse,
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url }),
    }),
  } as ArgumentsHost;
}

function createMockResponse(): MockResponse {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as MockResponse;

  response.status.mockReturnValue(response);

  return response;
}
