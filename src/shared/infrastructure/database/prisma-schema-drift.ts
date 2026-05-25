type PrismaSchemaDriftError = Error & {
  code?: string;
};

const PRISMA_SCHEMA_DRIFT_ERROR_CODES = new Set(['P2021', 'P2022']);

export function isPrismaSchemaDriftError(
  error: unknown,
): error is PrismaSchemaDriftError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    PRISMA_SCHEMA_DRIFT_ERROR_CODES.has(
      (error as PrismaSchemaDriftError).code ?? '',
    )
  );
}

export function createPrismaSchemaDriftMessage(): string {
  return 'Database schema is behind the Prisma schema. Run "pnpm run prisma:db:push" and retry.';
}
