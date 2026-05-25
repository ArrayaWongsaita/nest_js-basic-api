import {
  createPrismaSchemaDriftMessage,
  isPrismaSchemaDriftError,
} from '../shared/infrastructure/database/prisma-schema-drift';

export function logBootstrapPrismaError(
  error: unknown,
  log: (message: string, trace?: string) => void,
  defaultMessage: string,
): void {
  const trace = error instanceof Error ? error.stack : String(error);

  if (isPrismaSchemaDriftError(error)) {
    log(
      `${defaultMessage}. ${createPrismaSchemaDriftMessage()}`,
      trace,
    );
    return;
  }

  log(defaultMessage, trace);
}
