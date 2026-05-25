import { AdminResetScope, ResetDomainResult } from '../ports/resettable-domain-handler.port';

export interface AdminDataResetResult {
  readonly scope: AdminResetScope;
  readonly targetUserId: string | null;
  readonly domains: readonly string[];
  readonly mode: 'reset_to_demo_baseline';
  readonly reason: string | null;
  readonly domainResults: readonly ResetDomainResult[];
  readonly preservedSystemRecords: {
    readonly users: number;
    readonly roles: number;
    readonly permissions: number;
  };
  readonly completedAt: Date;
}
