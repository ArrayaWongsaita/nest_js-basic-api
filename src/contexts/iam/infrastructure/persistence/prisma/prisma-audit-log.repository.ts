import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import {
  AuditDetails,
  AuditEntryFilters,
  AuditEntryInput,
  AuditEntryView,
  AuditLogPort,
  AuditOutcome,
  PaginatedAuditEntries,
} from '../../../application/ports/audit-log.port';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntryInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        outcome: entry.outcome,
        details: (entry.details as object | undefined) ?? undefined,
      },
    });
  }

  async list(
    filters: AuditEntryFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedAuditEntries> {
    const where = {
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.targetType ? { targetType: filters.targetType } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };
    const [rows, totalItems] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map(
        (row): AuditEntryView => ({
          id: row.id,
          actorUserId: row.actorUserId,
          action: row.action,
          targetType: row.targetType,
          targetId: row.targetId,
          outcome: row.outcome as AuditOutcome,
          details: (row.details as AuditDetails | null) ?? null,
          createdAt: row.createdAt,
        }),
      ),
      totalItems,
    };
  }
}
