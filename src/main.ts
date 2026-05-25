import { createHttpApp } from './bootstrap/http/create-http-app';
import { loadRuntimeAppConfig } from './bootstrap/config/app-config';
import { createBootstrapLogger } from './bootstrap/logging/bootstrap-logger';

async function bootstrap() {
  const logger = createBootstrapLogger();
  const appConfig = loadRuntimeAppConfig();
  const app = await createHttpApp(appConfig);
  const port = appConfig.http.port;

  await app.listen(port);
  logger.log(`HTTP server listening on port ${port}`);
}

bootstrap().catch((error: unknown) => {
  const logger = createBootstrapLogger();
  const trace = error instanceof Error ? error.stack : String(error);

  logger.error('Failed to bootstrap application', trace);
  process.exitCode = 1;
});
