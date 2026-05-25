import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import {
  ApiBadRequestErrorResponse,
  ApiForbiddenErrorResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedErrorResponse,
} from './api-error-response-docs.decorator';

@Controller('docs-errors')
class TestErrorDocsController {
  @Get()
  @ApiBadRequestErrorResponse('The request payload failed validation.')
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing iam.permissions.read.',
  )
  @ApiInternalServerErrorResponse()
  read(): void {}
}

describe('Api error response docs decorators', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('publishes a status-specific example for each documented error response', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TestErrorDocsController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const openApiDocument = cleanupOpenApiDoc(
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('Test').setVersion('1.0.0').build(),
      ),
    );

    const responses =
      openApiDocument.paths['/docs-errors'].get?.responses ?? {};
    const badRequestExample =
      responses['400']?.content?.['application/json']?.example;
    const unauthorizedExample =
      responses['401']?.content?.['application/json']?.example;
    const forbiddenExample =
      responses['403']?.content?.['application/json']?.example;
    const internalServerErrorExample =
      responses['500']?.content?.['application/json']?.example;

    expect(badRequestExample).toMatchObject({
      statusCode: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
      },
    });
    expect(unauthorizedExample).toMatchObject({
      statusCode: 401,
      error: {
        code: 'UNAUTHORIZED',
        message: 'A valid Bearer access token is required.',
      },
    });
    expect(forbiddenExample).toMatchObject({
      statusCode: 403,
      error: {
        code: 'FORBIDDEN',
        message: 'The authenticated user is missing iam.permissions.read.',
      },
    });
    expect(internalServerErrorExample).toMatchObject({
      statusCode: 500,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      },
    });
  });
});
