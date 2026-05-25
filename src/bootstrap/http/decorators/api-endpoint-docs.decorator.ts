import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ZodDto, ZodResponse } from 'nestjs-zod';
import {
  ApiBadRequestErrorResponse,
  ApiInternalServerErrorResponse,
} from './api-error-response-docs.decorator';

type ApiEndpointDecorator = MethodDecorator & ClassDecorator;

type ApiResponseDto = ZodDto<any, boolean> | [ZodDto<any, boolean>];

type BaseEndpointDocsOptions = {
  readonly summary: string;
  readonly description: string;
  readonly successDescription: string;
  readonly responseType: ApiResponseDto;
  readonly badRequestDescription: string;
  readonly additionalResponses?: readonly ApiEndpointDecorator[];
};

export function ApiCreateEndpointDocs(
  options: BaseEndpointDocsOptions,
): MethodDecorator {
  return createEndpointDocsDecorator({
    ...options,
    successStatus: HttpStatus.CREATED,
  });
}

export function ApiListEndpointDocs(
  options: BaseEndpointDocsOptions,
): MethodDecorator {
  return createEndpointDocsDecorator({
    ...options,
    successStatus: HttpStatus.OK,
  });
}

export function ApiReadEndpointDocs(
  options: BaseEndpointDocsOptions,
): MethodDecorator {
  return createEndpointDocsDecorator({
    ...options,
    successStatus: HttpStatus.OK,
  });
}

export function ApiUpdateEndpointDocs(
  options: BaseEndpointDocsOptions,
): MethodDecorator {
  return createEndpointDocsDecorator({
    ...options,
    successStatus: HttpStatus.OK,
  });
}

type DeleteEndpointDocsOptions = Omit<
  BaseEndpointDocsOptions,
  'responseType' | 'successDescription'
> & {
  readonly successDescription: string;
};

export function ApiDeleteEndpointDocs(
  options: DeleteEndpointDocsOptions,
): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiBadRequestErrorResponse(options.badRequestDescription),
    ApiInternalServerErrorResponse(),
    ...(options.additionalResponses ?? []),
    ApiNoContentResponse({
      description: options.successDescription,
    }),
  );
}

type CreateEndpointDocsDecoratorOptions = BaseEndpointDocsOptions & {
  readonly successStatus: HttpStatus;
};

function createEndpointDocsDecorator(
  options: CreateEndpointDocsDecoratorOptions,
): MethodDecorator {
  return applyDecorators(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiBadRequestErrorResponse(options.badRequestDescription),
    ApiInternalServerErrorResponse(),
    ...(options.additionalResponses ?? []),
    ZodResponse({
      status: options.successStatus,
      description: options.successDescription,
      type: options.responseType as any,
    }),
  );
}
