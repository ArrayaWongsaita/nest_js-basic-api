import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { loadAppConfig } from '../src/bootstrap/config/app-config';
import { configureHttpApp } from '../src/bootstrap/http/configure-http-app';
import {
  ACCESS_TOKEN_ISSUER,
  ADMIN_USER_MANAGEMENT,
  AUDIT_LOG,
  RBAC_CATALOG,
} from '../src/contexts/iam/application/tokens';
import type { AccessTokenIssuer } from '../src/contexts/iam/application/ports/access-token-issuer.port';
import { InMemoryIamAdmin } from '../src/contexts/iam/application/testing/in-memory-iam-admin.fake';
import { InMemoryAuditLog } from '../src/contexts/iam/application/testing/in-memory-audit-log.fake';

const ADMIN_ID = '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1';
const OTHER_ADMIN_ID = '1b3f0a52-6a3e-4a67-9f0c-0d6c3d2a9a11';
const STUDENT_ID = '5c1d2e3f-4a5b-4c6d-8e7f-909a0b1c2d3e';

interface AuditEntryBody {
  actorUserId: string;
  action: string;
  targetId: string | null;
  outcome: string;
  details: Record<string, unknown> | null;
}

interface AuditListBody {
  data: AuditEntryBody[];
  meta: { page: number; limit: number; totalItems: number; totalPages: number };
}

async function bootApp(env: Record<string, string> = {}) {
  const appConfig = loadAppConfig({
    DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
    JWT_ACCESS_SECRET: 'test-access-secret',
    ...env,
  });
  const fake = new InMemoryIamAdmin([
    { userId: ADMIN_ID, roleNames: ['admin'] },
    { userId: OTHER_ADMIN_ID, roleNames: ['admin'] },
    { userId: STUDENT_ID, roleNames: ['student'] },
  ]);
  const audit = new InMemoryAuditLog();
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.register(appConfig)],
  })
    .overrideProvider(ADMIN_USER_MANAGEMENT)
    .useValue(fake)
    .overrideProvider(RBAC_CATALOG)
    .useValue(fake)
    .overrideProvider(AUDIT_LOG)
    .useValue(audit)
    .compile();

  const app = moduleRef.createNestApplication();
  configureHttpApp(app, appConfig);
  await app.init();

  const issuer = app.get<AccessTokenIssuer>(ACCESS_TOKEN_ISSUER);
  const tokenFor = async (userId: string, permissions: string[]) =>
    (
      await issuer.issue({
        userId,
        email: 'x@example.com',
        roles: ['admin'],
        permissions,
      })
    ).token;

  return { app, audit, tokenFor };
}

describe('Audit log (e2e)', () => {
  let app: INestApplication;
  let audit: InMemoryAuditLog;
  let adminToken: string;

  beforeEach(async () => {
    const booted = await bootApp();
    app = booted.app;
    audit = booted.audit;
    adminToken = await booted.tokenFor(ADMIN_ID, [
      'iam.users.deactivate',
      'iam.users.update_roles',
      'iam.audit_logs.read',
    ]);
  });

  afterEach(async () => {
    await app.close();
  });

  function patchStatus(userId: string, isActive: boolean) {
    return request(app.getHttpServer())
      .patch(`/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive });
  }

  function listAudit(query = '') {
    return request(app.getHttpServer())
      .get(`/admin/audit-logs${query}`)
      .set('Authorization', `Bearer ${adminToken}`);
  }

  it('records a success entry for a status change', async () => {
    await patchStatus(STUDENT_ID, false).expect(200);

    const response = await listAudit().expect(200);
    const body = response.body as AuditListBody;

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      actorUserId: ADMIN_ID,
      action: 'user.status_changed',
      targetId: STUDENT_ID,
      outcome: 'success',
      details: { isActive: false },
    });
  });

  it('records a rejected entry for an action blocked by a safety rule', async () => {
    await patchStatus(ADMIN_ID, false).expect(409);

    const body = (await listAudit().expect(200)).body as AuditListBody;

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      outcome: 'rejected',
      targetId: ADMIN_ID,
      details: { reason: 'Admins cannot deactivate their own account.' },
    });
  });

  it('records role changes', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/users/${STUDENT_ID}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleNames: ['editor'] })
      .expect(200);

    const body = (await listAudit().expect(200)).body as AuditListBody;

    expect(body.data[0]).toMatchObject({
      action: 'user.roles_changed',
      outcome: 'success',
      details: { roleNames: ['editor'] },
    });
  });

  it('filters by actor, action, target and date range and paginates', async () => {
    await patchStatus(STUDENT_ID, false).expect(200);
    await patchStatus(STUDENT_ID, true).expect(200);
    await patchStatus(ADMIN_ID, false).expect(409);
    await request(app.getHttpServer())
      .patch(`/admin/users/${STUDENT_ID}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleNames: ['editor'] })
      .expect(200);

    const total = (await listAudit().expect(200)).body as AuditListBody;
    expect(total.meta.totalItems).toBe(4);

    const byAction = (
      await listAudit('?action=user.status_changed').expect(200)
    ).body as AuditListBody;
    expect(byAction.meta.totalItems).toBe(3);

    const byTarget = (await listAudit(`?targetId=${ADMIN_ID}`).expect(200))
      .body as AuditListBody;
    expect(byTarget.data.map((entry) => entry.outcome)).toEqual(['rejected']);

    const byOtherActor = (
      await listAudit(`?actorUserId=${OTHER_ADMIN_ID}`).expect(200)
    ).body as AuditListBody;
    expect(byOtherActor.meta.totalItems).toBe(0);

    const future = (
      await listAudit('?from=2999-01-01T00:00:00.000Z').expect(200)
    ).body as AuditListBody;
    expect(future.meta.totalItems).toBe(0);

    const inRange = (
      await listAudit(
        `?from=2000-01-01T00:00:00.000Z&to=${new Date(Date.now() + 60_000).toISOString()}`,
      ).expect(200)
    ).body as AuditListBody;
    expect(inRange.meta.totalItems).toBe(4);

    const pageTwo = (await listAudit('?page=2&limit=3').expect(200))
      .body as AuditListBody;
    expect(pageTwo.data).toHaveLength(1);
    expect(pageTwo.meta).toMatchObject({
      page: 2,
      limit: 3,
      totalItems: 4,
      totalPages: 2,
    });
  });

  it('rejects a request without a token with 401', () => {
    return request(app.getHttpServer()).get('/admin/audit-logs').expect(401);
  });

  it('rejects a user without the audit-read permission with 403', async () => {
    const booted = await bootApp();
    const token = await booted.tokenFor(ADMIN_ID, ['iam.users.read']);

    await request(booted.app.getHttpServer())
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await booted.app.close();
  });

  it('records a rejected demo seed in production without leaking anything sensitive', async () => {
    const booted = await bootApp({ NODE_ENV: 'production' });
    const token = await booted.tokenFor(ADMIN_ID, [
      'system.reset.any',
      'iam.audit_logs.read',
    ]);

    await request(booted.app.getHttpServer())
      .post('/admin/demo-user-seeds')
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    const response = await request(booted.app.getHttpServer())
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const body = response.body as AuditListBody;

    expect(body.data[0]).toMatchObject({
      action: 'system.demo_seed',
      outcome: 'rejected',
    });
    expect(JSON.stringify(booted.audit.entries)).not.toMatch(
      /password|token|secret/i,
    );

    await booted.app.close();
  });

  it('exposes nothing in the in-memory log when no admin action ran', async () => {
    await listAudit().expect(200);

    expect(audit.entries).toHaveLength(0);
  });
});
