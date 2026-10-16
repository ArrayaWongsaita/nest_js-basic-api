import {
  AuditEntryFilters,
  AuditEntryInput,
  AuditEntryView,
  AuditLogPort,
  PaginatedAuditEntries,
} from '../ports/audit-log.port';

/**
 * In-memory AuditLogPort for specs and e2e tests.
 * `entries` exposes everything recorded (oldest first) for assertions.
 */
export class InMemoryAuditLog implements AuditLogPort {
  readonly entries: AuditEntryView[] = [];

  private sequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  record(entry: AuditEntryInput): Promise<void> {
    this.sequence += 1;
    this.entries.push({
      id: `audit-${this.sequence}`,
      actorUserId: entry.actorUserId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      outcome: entry.outcome,
      details: entry.details ?? null,
      createdAt: this.now(),
    });

    return Promise.resolve();
  }

  list(
    filters: AuditEntryFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedAuditEntries> {
    const matching = this.entries
      .filter(
        (entry) =>
          (!filters.actorUserId || entry.actorUserId === filters.actorUserId) &&
          (!filters.action || entry.action === filters.action) &&
          (!filters.targetType || entry.targetType === filters.targetType) &&
          (!filters.targetId || entry.targetId === filters.targetId) &&
          (!filters.from || entry.createdAt >= filters.from) &&
          (!filters.to || entry.createdAt <= filters.to),
      )
      .reverse();

    return Promise.resolve({
      items: matching.slice((page - 1) * limit, page * limit),
      totalItems: matching.length,
    });
  }
}
