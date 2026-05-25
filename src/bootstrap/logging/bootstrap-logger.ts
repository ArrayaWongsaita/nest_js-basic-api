import { Logger } from '@nestjs/common';

export function createBootstrapLogger(): Logger {
  return new Logger('Bootstrap');
}
