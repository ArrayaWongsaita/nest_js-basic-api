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
const STUDENT_ID = '5c1d2e3f-4a5b-4c6d-8e7f-909a0b1c2d3e';

interface UserBody {
  data: { userId: string; deletedAt: string | null };
}
interface ListBody {
  data: Array<{ userId: string }>;
}

describe('User soft delete and restore (e2e)', () => {
  let app: INestApplication;
  let fake: InMemoryIamAdmin;
  let audit: InMemoryAuditLog;
  let token: string;

  beforeEach(async () => {
    const appConfig = loadAppConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    fake = new InMemoryIamAdmin([
      { userId: ADMIN_ID, roleNames: ['admin'] },
      { userId: STUDENT_ID, roleNames: ['student'] },
    ]);
    audit = new InMemoryAuditLog();
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

    app = moduleRef.createNestApplication();
    configureHttpApp(app, appConfig);
    await app.init();

    const issuer = app.get<AccessTokenIssuer>(ACCESS_TOKEN_ISSUER);
    token = (
      await issuer.issue({
        userId: ADMIN_ID,
        email: 'x@example.com',
        roles: ['admin'],
        permissions: [
          'iam.users.read',
          'iam.users.delete',
          'iam.users.restore',
        ],
      })
    ).token;
  });

  afterEach(async () => {
    await app.close();
  });

  const auth = (req: request.Test) =>
    req.set('Authorization', `Bearer ${token}`);

  it('deletes a user, hides them from the list, ends their session and audits it', async () => {
    fake.seedSession(STUDENT_ID);

    const deleted = await auth(
      request(app.getHttpServer()).delete(`/admin/users/${STUDENT_ID}`),
    ).expect(200);
    expect((deleted.body as UserBody).data.deletedAt).not.toBeNull();
    expect(fake.hasSession(STUDENT_ID)).toBe(false);

    const list = await auth(
      request(app.getHttpServer()).get('/admin/users'),
    ).expect(200);
    expect((list.body as ListBody).data.map((u) => u.userId)).toEqual([
      ADMIN_ID,
    ]);

    const withDeleted = await auth(
      request(app.getHttpServer()).get('/admin/users?includeDeleted=true'),
    ).expect(200);
    expect((withDeleted.body as ListBody).data).toHaveLength(2);

    expect(audit.entries[0]).toMatchObject({
      action: 'user.deleted',
      targetId: STUDENT_ID,
      outcome: 'success',
    });
  });

  it('restores a deleted user and audits it', async () => {
    await auth(
      request(app.getHttpServer()).delete(`/admin/users/${STUDENT_ID}`),
    ).expect(200);

    const restored = await auth(
      request(app.getHttpServer()).post(`/admin/users/${STUDENT_ID}/restore`),
    ).expect(200);
    expect((restored.body as UserBody).data.deletedAt).toBeNull();

    const list = await auth(
      request(app.getHttpServer()).get('/admin/users'),
    ).expect(200);
    expect((list.body as ListBody).data).toHaveLength(2);
    expect(audit.entries.map((e) => e.action)).toEqual([
      'user.deleted',
      'user.restored',
    ]);
  });

  it('rejects self-delete with 409 and records it as rejected', async () => {
    await auth(
      request(app.getHttpServer()).delete(`/admin/users/${ADMIN_ID}`),
    ).expect(409);

    expect(audit.entries[0]).toMatchObject({
      action: 'user.deleted',
      outcome: 'rejected',
    });
  });

  it('requires a token and the delete permission', async () => {
    await request(app.getHttpServer())
      .delete(`/admin/users/${STUDENT_ID}`)
      .expect(401);

    const issuer = app.get<AccessTokenIssuer>(ACCESS_TOKEN_ISSUER);
    const weak = (
      await issuer.issue({
        userId: ADMIN_ID,
        email: 'x@example.com',
        roles: ['admin'],
        permissions: ['iam.users.read'],
      })
    ).token;

    await request(app.getHttpServer())
      .delete(`/admin/users/${STUDENT_ID}`)
      .set('Authorization', `Bearer ${weak}`)
      .expect(403);
  });
});
