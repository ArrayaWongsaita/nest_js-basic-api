export type AuditOutcome = 'success' | 'rejected';

/** JSON-safe payload. Never put passwords, tokens or hashes in here. */
export type AuditDetails = Record<string, unknown>;

export interface AuditEntryInput {
  /** The admin who attempted the action. */
  readonly actorUserId: string;
  /** Dotted action name, see `AUDIT_ACTIONS`. */
  readonly action: string;
  /** What kind of thing was acted on, see `AUDIT_TARGET_TYPES`. */
  readonly targetType: string;
  /** Identifier of the thing acted on, or null when there is none. */
  readonly targetId: string | null;
  readonly outcome: AuditOutcome;
  readonly details?: AuditDetails;
}

export interface AuditEntryView {
  readonly id: string;
  readonly actorUserId: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string | null;
  readonly outcome: AuditOutcome;
  readonly details: AuditDetails | null;
  readonly createdAt: Date;
}

export interface AuditEntryFilters {
  readonly actorUserId?: string;
  readonly action?: string;
  readonly targetType?: string;
  readonly targetId?: string;
  /** Inclusive lower bound on createdAt. */
  readonly from?: Date;
  /** Inclusive upper bound on createdAt. */
  readonly to?: Date;
}

export interface PaginatedAuditEntries {
  readonly items: readonly AuditEntryView[];
  readonly totalItems: number;
}

export interface AuditLogPort {
  record(entry: AuditEntryInput): Promise<void>;
  /** Newest first. */
  list(
    filters: AuditEntryFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedAuditEntries>;
}
