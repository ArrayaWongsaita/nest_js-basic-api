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
import { BOOK_REPOSITORY } from '../src/contexts/book/application/tokens';
import { InMemoryBookRepository } from '../src/contexts/book/application/testing/in-memory-book.repository';
import { Book } from '../src/contexts/book/domain/aggregates/book.aggregate';

const ADMIN_ID = '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1';
const STUDENT_ID = '5c1d2e3f-4a5b-4c6d-8e7f-909a0b1c2d3e';
const OTHER_STUDENT_ID = '7a7a7a7a-4a5b-4c6d-8e7f-909a0b1c2d3e';
const UNKNOWN_ID = '99999999-4a5b-4c6d-8e7f-909a0b1c2d3e';

function makeBookProps(userId: string, title: string) {
  return { userId, title, author: 'a', genre: null, publishedYear: null };
}

interface BookBody {
  id: string;
  userId: string;
  title: string;
}

describe('Admin cross-user books (e2e)', () => {
  let app: INestApplication;
  let audit: InMemoryAuditLog;
  let books: InMemoryBookRepository;
  let bookId: string;
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
    books = new InMemoryBookRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(appConfig)],
    })
      .overrideProvider(ADMIN_USER_MANAGEMENT)
      .useValue(fake)
      .overrideProvider(RBAC_CATALOG)
      .useValue(fake)
      .overrideProvider(AUDIT_LOG)
      .useValue(audit)
      .overrideProvider(BOOK_REPOSITORY)
      .useValue(books)
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

    const book = Book.create(makeBookProps(STUDENT_ID, 'Student book'));
    bookId = book.id.toString();
    await books.save(book);
    await books.save(
      Book.create(makeBookProps(OTHER_STUDENT_ID, 'Other book')),
    );
  });

  afterEach(async () => {
    await app.close();
  });

  const adminPermissions = ['book.read_any', 'book.delete_any'];

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

  it('lets an admin list only the target user books', async () => {
    const response = await call(
      'get',
      `/admin/users/${STUDENT_ID}/books`,
      adminPermissions,
    ).then((r) => r.expect(200));
    const body = response.body as {
      data: { userId: string; items: BookBody[] };
    };

    expect(body.data.userId).toBe(STUDENT_ID);
    expect(body.data.items.map((item) => item.title)).toEqual(['Student book']);
  });

  it('lets an admin view one book of the user', async () => {
    const response = await call(
      'get',
      `/admin/users/${STUDENT_ID}/books/${bookId}`,
      adminPermissions,
    ).then((r) => r.expect(200));

    expect((response.body as { data: BookBody }).data).toMatchObject({
      id: bookId,
      userId: STUDENT_ID,
    });
  });

  it('does not expose an edit route', async () => {
    await call(
      'patch',
      `/admin/users/${STUDENT_ID}/books/${bookId}`,
      adminPermissions,
    ).then((r) => r.expect(404));
  });

  it('lets an admin delete a book and records an audit entry', async () => {
    await call(
      'delete',
      `/admin/users/${STUDENT_ID}/books/${bookId}`,
      adminPermissions,
    ).then((r) => r.expect(204));

    await call(
      'get',
      `/admin/users/${STUDENT_ID}/books/${bookId}`,
      adminPermissions,
    ).then((r) => r.expect(404));
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]).toMatchObject({
      actorUserId: ADMIN_ID,
      action: 'book.deleted_by_admin',
      targetType: 'book',
      targetId: bookId,
      outcome: 'success',
      details: { ownerUserId: STUDENT_ID },
    });
  });

  it('forbids a student and leaves data untouched', async () => {
    const studentPermissions = ['book.read_own', 'book.delete_own'];

    await call(
      'get',
      `/admin/users/${OTHER_STUDENT_ID}/books`,
      studentPermissions,
      STUDENT_ID,
    ).then((r) => r.expect(403));
    await call(
      'delete',
      `/admin/users/${STUDENT_ID}/books/${bookId}`,
      studentPermissions,
      OTHER_STUDENT_ID,
    ).then((r) => r.expect(403));

    expect(await books.findByIdAndUserId(bookId, STUDENT_ID)).not.toBeNull();
    expect(audit.entries).toHaveLength(0);
  });

  it('lets a read-any-only holder read but not delete', async () => {
    await call('get', `/admin/users/${STUDENT_ID}/books/${bookId}`, [
      'book.read_any',
    ]).then((r) => r.expect(200));
    await call('delete', `/admin/users/${STUDENT_ID}/books/${bookId}`, [
      'book.read_any',
    ]).then((r) => r.expect(403));

    expect(await books.findByIdAndUserId(bookId, STUDENT_ID)).not.toBeNull();
  });

  it('requires a token', async () => {
    await request(app.getHttpServer())
      .get(`/admin/users/${STUDENT_ID}/books`)
      .expect(401);
  });

  it('returns not found for an unknown user', async () => {
    await call(
      'get',
      `/admin/users/${UNKNOWN_ID}/books`,
      adminPermissions,
    ).then((r) => r.expect(404));
    await call(
      'delete',
      `/admin/users/${UNKNOWN_ID}/books/${bookId}`,
      adminPermissions,
    ).then((r) => r.expect(404));
  });

  it('returns not found for an unknown item or one owned by someone else', async () => {
    await call(
      'get',
      `/admin/users/${STUDENT_ID}/books/${UNKNOWN_ID}`,
      adminPermissions,
    ).then((r) => r.expect(404));
    await call(
      'delete',
      `/admin/users/${OTHER_STUDENT_ID}/books/${bookId}`,
      adminPermissions,
    ).then((r) => r.expect(404));

    expect(await books.findByIdAndUserId(bookId, STUDENT_ID)).not.toBeNull();
  });
});
