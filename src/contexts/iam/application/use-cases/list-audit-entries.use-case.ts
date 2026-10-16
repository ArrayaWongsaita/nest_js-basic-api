import { UseCase } from '../../../../shared/application/use-case';
import {
  AuditEntryFilters,
  AuditEntryView,
  AuditLogPort,
} from '../ports/audit-log.port';

export interface ListAuditEntriesRequest extends AuditEntryFilters {
  readonly page: number;
  readonly limit: number;
}

export interface AuditEntryListResult {
  readonly items: readonly AuditEntryView[];
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export class ListAuditEntriesUseCase implements UseCase<
  ListAuditEntriesRequest,
  AuditEntryListResult
> {
  constructor(private readonly auditLog: AuditLogPort) {}

  async execute(
    request: ListAuditEntriesRequest,
  ): Promise<AuditEntryListResult> {
    const { page, limit, ...filters } = request;
    const result = await this.auditLog.list(filters, page, limit);

    return {
      items: result.items,
      page,
      limit,
      totalItems: result.totalItems,
      totalPages: Math.max(1, Math.ceil(result.totalItems / limit)),
    };
  }
}
