import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { loadAppConfig } from '../src/bootstrap/config/app-config';
import { configureHttpApp } from '../src/bootstrap/http/configure-http-app';
import {
  ACCESS_TOKEN_ISSUER,
  ADMIN_USER_MANAGEMENT,
  RBAC_CATALOG,
} from '../src/contexts/iam/application/tokens';
import type { AccessTokenIssuer } from '../src/contexts/iam/application/ports/access-token-issuer.port';
import { InMemoryIamAdmin } from '../src/contexts/iam/application/testing/in-memory-iam-admin.fake';

const ADMIN_ID = '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1';
const OTHER_ADMIN_ID = '1b3f0a52-6a3e-4a67-9f0c-0d6c3d2a9a11';

function errorMessageOf(response: Response): string {
  return (response.body as { error: { message: string } }).error.message;
}

describe('Admin safety rules (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeEach(async () => {
    const appConfig = loadAppConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    const fake = new InMemoryIamAdmin([
      { userId: ADMIN_ID, roleNames: ['admin'] },
      { userId: OTHER_ADMIN_ID, roleNames: ['admin'] },
    ]);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(appConfig)],
    })
      .overrideProvider(ADMIN_USER_MANAGEMENT)
      .useValue(fake)
      .overrideProvider(RBAC_CATALOG)
      .useValue(fake)
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
        permissions: ['iam.users.deactivate', 'iam.users.update_roles'],
      })
    ).token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects an admin deactivating their own account with a rule message', () => {
    return request(app.getHttpServer())
      .patch(`/admin/users/${ADMIN_ID}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(409)
      .expect((response: Response) => {
        expect(errorMessageOf(response)).toBe(
          'Admins cannot deactivate their own account.',
        );
      });
  });

  it('rejects an admin removing their own admin role', () => {
    return request(app.getHttpServer())
      .patch(`/admin/users/${ADMIN_ID}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleNames: ['student'] })
      .expect(409)
      .expect((response: Response) => {
        expect(errorMessageOf(response)).toBe(
          'Admins cannot remove the admin role from their own account.',
        );
      });
  });

  it('still allows deactivating another admin while one remains active', () => {
    return request(app.getHttpServer())
      .patch(`/admin/users/${OTHER_ADMIN_ID}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);
  });
});
