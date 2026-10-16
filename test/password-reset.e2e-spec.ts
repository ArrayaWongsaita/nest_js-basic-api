import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { loadAppConfig } from '../src/bootstrap/config/app-config';
import { configureHttpApp } from '../src/bootstrap/http/configure-http-app';
import {
  ACCESS_TOKEN_ISSUER,
  ADMIN_USER_MANAGEMENT,
  AUDIT_LOG,
  AUTH_SESSION_REPOSITORY,
  RBAC_CATALOG,
  USER_ACCESS_READER,
  USER_CREDENTIALS,
} from '../src/contexts/iam/application/tokens';
import { InMemoryAuditLog } from '../src/contexts/iam/application/testing/in-memory-audit-log.fake';
import { InMemoryAuthSessionRepository } from '../src/contexts/iam/application/testing/in-memory-auth-session-repository.fake';
import { InMemoryCredentialStore } from '../src/contexts/iam/application/testing/in-memory-credential-store.fake';
import { InMemoryIamAdmin } from '../src/contexts/iam/application/testing/in-memory-iam-admin.fake';
import type { AccessTokenIssuer } from '../src/contexts/iam/application/ports/access-token-issuer.port';
import { ScryptPasswordHasher } from '../src/contexts/iam/infrastructure/providers/scrypt-password-hasher';

const ADMIN_ID = '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1';
const STUDENT_ID = '1b3f0a52-6a3e-4a67-9f0c-0d6c3d2a9a11';
const STUDENT_EMAIL = 'student@example.com';
const STUDENT_PASSWORD = 'student-password-123';

interface Envelope<T> {
  data: T;
}

function dataOf<T>(response: Response): T {
  return (response.body as Envelope<T>).data;
}

function errorMessageOf(response: Response): string {
  return (response.body as { error: { message: string } }).error.message;
}

describe('Admin password reset and password change (e2e)', () => {
  let app: INestApplication;
  let fake: InMemoryIamAdmin;
  let audit: InMemoryAuditLog;
  let adminToken: string;
  let studentToken: string;

  function resetStudentPassword() {
    return request(app.getHttpServer())
      .post(`/admin/users/${STUDENT_ID}/password-reset`)
      .set('Authorization', `Bearer ${adminToken}`);
  }

  function login(password: string) {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: STUDENT_EMAIL, password });
  }

  beforeEach(async () => {
    const appConfig = loadAppConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    fake = new InMemoryIamAdmin([
      { userId: ADMIN_ID, roleNames: ['admin'] },
      { userId: STUDENT_ID },
    ]);
    audit = new InMemoryAuditLog();
    const credentials = new InMemoryCredentialStore([
      {
        userId: STUDENT_ID,
        email: STUDENT_EMAIL,
        passwordHash: await new ScryptPasswordHasher().hash(STUDENT_PASSWORD),
        permissions: ['todo.read_own'],
      },
    ]);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(appConfig)],
    })
      .overrideProvider(ADMIN_USER_MANAGEMENT)
      .useValue(fake)
      .overrideProvider(RBAC_CATALOG)
      .useValue(fake)
      .overrideProvider(AUDIT_LOG)
      .useValue(audit)
      .overrideProvider(USER_ACCESS_READER)
      .useValue(credentials)
      .overrideProvider(USER_CREDENTIALS)
      .useValue(credentials)
      .overrideProvider(AUTH_SESSION_REPOSITORY)
      .useValue(new InMemoryAuthSessionRepository())
      .compile();

    app = moduleRef.createNestApplication();
    configureHttpApp(app, appConfig);
    await app.init();

    const issuer = app.get<AccessTokenIssuer>(ACCESS_TOKEN_ISSUER);
    adminToken = (
      await issuer.issue({
        userId: ADMIN_ID,
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['iam.users.reset_password'],
      })
    ).token;
    studentToken = (
      await issuer.issue({
        userId: STUDENT_ID,
        email: STUDENT_EMAIL,
        roles: ['student'],
        permissions: ['todo.read_own'],
      })
    ).token;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('admin reset', () => {
    it('returns a temporary password once and revokes the session', async () => {
      fake.seedSession(STUDENT_ID);

      const response = await resetStudentPassword().expect(200);

      const body = dataOf<{ userId: string; temporaryPassword: string }>(
        response,
      );
      expect(body.userId).toBe(STUDENT_ID);
      expect(body.temporaryPassword.length).toBeGreaterThanOrEqual(12);
      expect(fake.hasSession(STUDENT_ID)).toBe(false);
      await login(body.temporaryPassword).expect(200);
      await login(STUDENT_PASSWORD).expect(401);
    });

    it('is forbidden without the reset permission', () => {
      return request(app.getHttpServer())
        .post(`/admin/users/${ADMIN_ID}/password-reset`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('returns not found for an unknown user', () => {
      return request(app.getHttpServer())
        .post('/admin/users/6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31/password-reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('records the reset in the audit log without any password', async () => {
      const response = await resetStudentPassword().expect(200);
      const { temporaryPassword } = dataOf<{ temporaryPassword: string }>(
        response,
      );

      const entries = audit.entries;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        actorUserId: ADMIN_ID,
        action: 'user.password_reset',
        targetType: 'user',
        targetId: STUDENT_ID,
        outcome: 'success',
      });
      expect(JSON.stringify(entries)).not.toContain(temporaryPassword);
    });
  });

  describe('forced change after reset', () => {
    it('only allows changing the password until it is changed', async () => {
      const reset = await resetStudentPassword().expect(200);
      const { temporaryPassword } = dataOf<{ temporaryPassword: string }>(
        reset,
      );
      const loginResponse = await login(temporaryPassword).expect(200);
      const session = dataOf<{
        accessToken: string;
        mustChangePassword: boolean;
      }>(loginResponse);
      expect(session.mustChangePassword).toBe(true);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          currentPassword: temporaryPassword,
          newPassword: 'a-brand-new-password-9',
        })
        .expect(204);

      const next = await login('a-brand-new-password-9').expect(200);
      const nextSession = dataOf<{
        accessToken: string;
        mustChangePassword: boolean;
      }>(next);
      expect(nextSession.mustChangePassword).toBe(false);
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${nextSession.accessToken}`)
        .expect(200);
    });
  });

  describe('self-service change', () => {
    function change(body: Record<string, string>) {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(body);
    }

    it('changes the password when the current one is correct', async () => {
      await change({
        currentPassword: STUDENT_PASSWORD,
        newPassword: 'another-strong-password-1',
      }).expect(204);

      await login(STUDENT_PASSWORD).expect(401);
      await login('another-strong-password-1').expect(200);
    });

    it('rejects a wrong current password', async () => {
      const response = await change({
        currentPassword: 'definitely-not-it-1',
        newPassword: 'another-strong-password-1',
      }).expect(400);

      expect(errorMessageOf(response)).toBe('Current password is incorrect.');
      await login(STUDENT_PASSWORD).expect(200);
    });

    it('rejects a weak new password', async () => {
      const response = await change({
        currentPassword: STUDENT_PASSWORD,
        newPassword: 'short',
      }).expect(400);

      expect(errorMessageOf(response)).toBe(
        'Password must be at least 12 characters long.',
      );
      await login(STUDENT_PASSWORD).expect(200);
    });

    it('requires authentication', () => {
      return request(app.getHttpServer())
        .post('/auth/change-password')
        .send({ currentPassword: 'x', newPassword: 'y' })
        .expect(401);
    });
  });
});
