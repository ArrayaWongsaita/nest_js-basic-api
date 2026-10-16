import { Result } from '../../../../shared/application/result';
import { InMemoryAuditLog } from '../testing/in-memory-audit-log.fake';
import { AuditedAction } from './audited-action';

interface Req {
  readonly userId: string;
  readonly password: string;
}

function setup(outcome: Result<string, string>) {
  const audit = new InMemoryAuditLog();
  const action = new AuditedAction<Req, Result<string, string>>(
    { execute: () => Promise.resolve(outcome) },
    audit,
    (request) => ({
      action: 'user.status_changed',
      targetType: 'user',
      targetId: request.userId,
      details: { isActive: false },
    }),
  );

  return { audit, action };
}

describe('AuditedAction', () => {
  it('records a success entry and returns the inner result unchanged', async () => {
    const { audit, action } = setup(Result.success('done'));

    const result = await action.execute('admin-1', {
      userId: 'u1',
      password: 'secret',
    });

    expect(result.ok).toBe(true);
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorUserId: 'admin-1',
      action: 'user.status_changed',
      targetType: 'user',
      targetId: 'u1',
      outcome: 'success',
      details: { isActive: false },
    });
  });

  it('records a rejected entry with the rule message when the action fails', async () => {
    const { audit, action } = setup(Result.failure('Rule violated.'));

    const result = await action.execute('admin-1', {
      userId: 'u1',
      password: 'secret',
    });

    expect(result.ok).toBe(false);
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      outcome: 'rejected',
      details: { isActive: false, reason: 'Rule violated.' },
    });
  });

  it('never copies the request into the entry', async () => {
    const { audit, action } = setup(Result.success('done'));

    await action.execute('admin-1', { userId: 'u1', password: 'secret' });

    expect(JSON.stringify(audit.entries)).not.toContain('secret');
  });

  it('records a rejected entry and rethrows when the inner use case throws', async () => {
    const audit = new InMemoryAuditLog();
    const action = new AuditedAction<Req, Result<string, string>>(
      { execute: () => Promise.reject(new Error('db down')) },
      audit,
      (request) => ({
        action: 'user.status_changed',
        targetType: 'user',
        targetId: request.userId,
      }),
    );

    await expect(
      action.execute('admin-1', { userId: 'u1', password: 'secret' }),
    ).rejects.toThrow('db down');

    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorUserId: 'admin-1',
      outcome: 'rejected',
      targetId: 'u1',
    });
    expect(JSON.stringify(audit.entries)).not.toContain('secret');
  });
});
