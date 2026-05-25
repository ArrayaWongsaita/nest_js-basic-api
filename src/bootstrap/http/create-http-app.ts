import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AppConfig } from '../config/app-config';
import { configureHttpApp } from './configure-http-app';

export async function createHttpApp(
  appConfig: AppConfig,
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.register(appConfig), {
    bufferLogs: true,
  });

  configureHttpApp(app, appConfig);

  return app;
}
