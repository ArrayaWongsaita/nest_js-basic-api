export interface AdminMaintenancePolicy {
  /** False when running in production without the explicit enable setting. */
  readonly allowed: boolean;
}

export const ADMIN_MAINTENANCE_DISABLED_IN_PRODUCTION_MESSAGE =
  'This maintenance operation is disabled in production. Set ADMIN_MAINTENANCE_ALLOW_IN_PRODUCTION=true to enable it.';
