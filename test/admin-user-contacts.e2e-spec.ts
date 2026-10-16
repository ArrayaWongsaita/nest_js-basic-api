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
import { CONTACT_REPOSITORY } from '../src/contexts/contact/application/tokens';
import { InMemoryContactRepository } from '../src/contexts/contact/application/testing/in-memory-contact.repository';
import { Contact } from '../src/contexts/contact/domain/aggregates/contact.aggregate';

const ADMIN_ID = '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1';
const STUDENT_ID = '5c1d2e3f-4a5b-4c6d-8e7f-909a0b1c2d3e';
const OTHER_STUDENT_ID = '7a7a7a7a-4a5b-4c6d-8e7f-909a0b1c2d3e';
const UNKNOWN_ID = '99999999-4a5b-4c6d-8e7f-909a0b1c2d3e';

function makeContactProps(userId: string, title: string) {
  return {
    userId,
    firstName: title,
    lastName: null,
    email: null,
    phone: null,
    company: null,
    address: null,
  };
}

interface ContactBody {
  id: string;
  userId: string;
  firstName: string;
}

describe('Admin cross-user contacts (e2e)', () => {
  let app: INestApplication;
  let audit: InMemoryAuditLog;
  let contacts: InMemoryContactRepository;
  let contactId: string;
  let tokenFor: (userId: string, permissions: string[]) => Promise<string>;

  beforeEach(async () => {
    const appConfig = loadAppConfig({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      JWT_ACCESS_SECRET: 'test-access-secret',
    });
    const fake = new InMemoryIamAdmin([
      { userId: ADMIN_ID, roleNames: ['admin'] },
      { userId: STUDENT_ID, roleNames: ['student'] },
      { userId: OTHER_STUDENT_ID, roleNames: ['student'] },
    ]);
    audit = new InMemoryAuditLog();
    contacts = new InMemoryContactRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(appConfig)],
    })
      .overrideProvider(ADMIN_USER_MANAGEMENT)
      .useValue(fake)
      .overrideProvider(RBAC_CATALOG)
      .useValue(fake)
      .overrideProvider(AUDIT_LOG)
      .useValue(audit)
      .overrideProvider(CONTACT_REPOSITORY)
      .useValue(contacts)
      .compile();

    app = moduleRef.createNestApplication();
    configureHttpApp(app, appConfig);
    await app.init();

    const issuer = app.get<AccessTokenIssuer>(ACCESS_TOKEN_ISSUER);
    tokenFor = async (userId, permissions) =>
      (
        await issuer.issue({
          userId,
          email: 'x@example.com',
          roles: ['x'],
          permissions,
        })
      ).token;

    const contact = Contact.create(
      makeContactProps(STUDENT_ID, 'Student contact'),
    );
    contactId = contact.id.toString();
    await contacts.save(contact);
    await contacts.save(
      Contact.create(makeContactProps(OTHER_STUDENT_ID, 'Other contact')),
    );
  });

  afterEach(async () => {
    await app.close();
  });

  const adminPermissions = ['contact.read_any', 'contact.delete_any'];

  async function call(
    method: 'get' | 'delete' | 'patch',
    path: string,
    permissions: string[],
    actor = ADMIN_ID,
  ) {
    const token = await tokenFor(actor, permissions);

    const pending = request(app.getHttpServer())
      [method](path)
      .set('Authorization', `Bearer ${token}`);

    // Wrapped so the async return does not send the request prematurely.
    return { expect: (status: number) => pending.expect(status) };
  }

  it('lets an admin list only the target user contacts', async () => {
    const response = await call(
      'get',
      `/admin/users/${STUDENT_ID}/contacts`,
      adminPermissions,
    ).then((r) => r.expect(200));
    const body = response.body as {
      data: { userId: string; items: ContactBody[] };
    };

    expect(body.data.userId).toBe(STUDENT_ID);
    expect(body.data.items.map((item) => item.firstName)).toEqual([
      'Student contact',
    ]);
  });

  it('lets an admin view one contact of the user', async () => {
    const response = await call(
      'get',
      `/admin/users/${STUDENT_ID}/contacts/${contactId}`,
      adminPermissions,
    ).then((r) => r.expect(200));

    expect((response.body as { data: ContactBody }).data).toMatchObject({
      id: contactId,
      userId: STUDENT_ID,
    });
  });

  it('does not expose an edit route', async () => {
    await call(
      'patch',
      `/admin/users/${STUDENT_ID}/contacts/${contactId}`,
      adminPermissions,
    ).then((r) => r.expect(404));
  });

  it('lets an admin delete a contact and records an audit entry', async () => {
    await call(
      'delete',
      `/admin/users/${STUDENT_ID}/contacts/${contactId}`,
      adminPermissions,
    ).then((r) => r.expect(204));

    await call(
      'get',
      `/admin/users/${STUDENT_ID}/contacts/${contactId}`,
      adminPermissions,
    ).then((r) => r.expect(404));
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorUserId: ADMIN_ID,
      action: 'contact.deleted_by_admin',
      targetType: 'contact',
      targetId: contactId,
      outcome: 'success',
      details: { ownerUserId: STUDENT_ID },
    });
  });

  it('forbids a student and leaves data untouched', async () => {
    const studentPermissions = ['contact.read_own', 'contact.delete_own'];

    await call(
      'get',
      `/admin/users/${OTHER_STUDENT_ID}/contacts`,
      studentPermissions,
      STUDENT_ID,
    ).then((r) => r.expect(403));
    await call(
      'delete',
      `/admin/users/${STUDENT_ID}/contacts/${contactId}`,
      studentPermissions,
      OTHER_STUDENT_ID,
    ).then((r) => r.expect(403));

    expect(
      await contacts.findByIdAndUserId(contactId, STUDENT_ID),
    ).not.toBeNull();
    expect(audit.entries).toHaveLength(0);
  });

  it('lets a read-any-only holder read but not delete', async () => {
    await call('get', `/admin/users/${STUDENT_ID}/contacts/${contactId}`, [
      'contact.read_any',
    ]).then((r) => r.expect(200));
    await call('delete', `/admin/users/${STUDENT_ID}/contacts/${contactId}`, [
      'contact.read_any',
    ]).then((r) => r.expect(403));

    expect(
      await contacts.findByIdAndUserId(contactId, STUDENT_ID),
    ).not.toBeNull();
  });

  it('requires a token', async () => {
    await request(app.getHttpServer())
      .get(`/admin/users/${STUDENT_ID}/contacts`)
      .expect(401);
  });

  it('returns not found for an unknown user', async () => {
    await call(
      'get',
      `/admin/users/${UNKNOWN_ID}/contacts`,
      adminPermissions,
    ).then((r) => r.expect(404));
    await call(
      'delete',
      `/admin/users/${UNKNOWN_ID}/contacts/${contactId}`,
      adminPermissions,
    ).then((r) => r.expect(404));
  });

  it('returns not found for an unknown item or one owned by someone else', async () => {
    await call(
      'get',
      `/admin/users/${STUDENT_ID}/contacts/${UNKNOWN_ID}`,
      adminPermissions,
    ).then((r) => r.expect(404));
    await call(
      'delete',
      `/admin/users/${OTHER_STUDENT_ID}/contacts/${contactId}`,
      adminPermissions,
    ).then((r) => r.expect(404));

    expect(
      await contacts.findByIdAndUserId(contactId, STUDENT_ID),
    ).not.toBeNull();
  });
});
