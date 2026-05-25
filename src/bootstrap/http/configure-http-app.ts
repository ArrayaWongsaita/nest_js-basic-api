import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppConfig } from '../config/app-config';
import { HttpExceptionFilter } from '../../shared/presentation/http/filters/http-exception.filter';
import { setupSwaggerDocs } from './setup-swagger-docs';

export function configureHttpApp(
  app: INestApplication,
  appConfig: AppConfig,
): void {
  if (appConfig.cors.allowedOrigins.length > 0) {
    app.enableCors({
      origin: appConfig.cors.allowedOrigins,
      credentials: true,
    });
  }

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new ZodSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());
  setupSwaggerDocs(app, appConfig);
}
