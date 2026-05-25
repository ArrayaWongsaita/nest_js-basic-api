import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from './app-config';

@Global()
@Module({})
export class AppConfigModule {
  static register(appConfig: AppConfig): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [
        {
          provide: APP_CONFIG,
          useValue: appConfig,
        },
      ],
      exports: [APP_CONFIG],
    };
  }
}
