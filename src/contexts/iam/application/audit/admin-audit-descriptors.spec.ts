import { describeDataReset } from './admin-audit-descriptors';

describe('describeDataReset', () => {
  it('does not carry the free-text reason into the audit details', () => {
    const descriptor = describeDataReset({
      actorUserId: 'admin-1',
      scope: 'global',
      targetUserId: null,
      domains: ['todo'],
      mode: 'reset_to_demo_baseline',
      reason: 'password is hunter2',
    });

    expect(JSON.stringify(descriptor)).not.toContain('hunter2');
    expect(descriptor.details).toMatchObject({
      scope: 'global',
      domains: ['todo'],
      hasReason: true,
    });
  });
});
