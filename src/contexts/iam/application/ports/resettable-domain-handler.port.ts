export type AdminResetScope = 'user' | 'global';

export interface ResetExecutionContext {
  readonly scope: AdminResetScope;
  readonly targetUserId: string | null;
}

export interface ResetDomainResult {
  readonly domain: string;
  readonly deletedRecords: number;
  readonly preservedRecords: number;
}

export interface ResettableDomainHandler {
  readonly domainName: string;
  reset(context: ResetExecutionContext): Promise<ResetDomainResult>;
}
