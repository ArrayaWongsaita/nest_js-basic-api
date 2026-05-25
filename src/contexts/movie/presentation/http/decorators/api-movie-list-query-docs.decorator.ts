import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiMovieListQueryDocs(): MethodDecorator {
  return applyDecorators(
    ApiQuery({
      name: 'search',
      required: false,
      schema: {
        type: 'string',
      },
      description:
        'Optional case-insensitive text filter applied to the movie title, director, and genre.',
      example: 'inception',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      schema: {
        type: 'integer',
        minimum: 1,
        default: 1,
      },
      description: '1-based page number for paginated list responses.',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      description:
        'Maximum number of items returned in one page. Defaults to 10 and cannot exceed 100.',
      example: 10,
    }),
  );
}
