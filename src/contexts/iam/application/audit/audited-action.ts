import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { AuditDetails, AuditLogPort } from '../ports/audit-log.port';

export interface AuditDescriptor {
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string | null;
  /** Small, secret-free payload. Do not copy the request wholesale. */
  readonly details?: AuditDetails;
}

/**
 * Wraps a Result-returning use case so that every attempt is recorded in the
 * audit log: `success` when the result is ok, `rejected` (with the failure
 * message under `details.reason`) when it is not. The inner use case and its
 * result are untouched.
 */
export class AuditedAction<TRequest, TResult extends Result<unknown, string>> {
  constructor(
    private readonly inner: UseCase<TRequest, TResult>,
    private readonly audit: AuditLogPort,
    private readonly describe: (
      request: TRequest,
      result: TResult,
    ) => AuditDescriptor,
  ) {}

  async execute(actorUserId: string, request: TRequest): Promise<TResult> {
    const result = await this.inner.execute(request);
    const descriptor = this.describe(request, result);

    await this.audit.record({
      actorUserId,
      action: descriptor.action,
      targetType: descriptor.targetType,
      targetId: descriptor.targetId,
      outcome: result.ok ? 'success' : 'rejected',
      details: result.ok
        ? descriptor.details
        : { ...descriptor.details, reason: result.error },
    });

    return result;
  }
}
