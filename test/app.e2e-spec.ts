import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { createHttpApp } from '../src/bootstrap/http/create-http-app';
import { loadAppConfig } from '../src/bootstrap/config/app-config';

const TEST_USER_ID = '8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1';

function createBaseEnv(): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
    JWT_ACCESS_SECRET: 'test-access-secret',
  };
}

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const appConfig = loadAppConfig(createBaseEnv());
    app = await createHttpApp(appConfig);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          success: unknown;
          data: {
            service: unknown;
            status: unknown;
            timestamp: unknown;
          };
        };

        expect(body).toMatchObject({
          success: true,
          data: {
            status: 'ok',
            service: 'api',
          },
        });
        expect(body.data.timestamp).toEqual(expect.any(String));
      });
  });
});

describe('Swagger docs and auth boundaries (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const appConfig = loadAppConfig({
      ...createBaseEnv(),
      SWAGGER_ENABLED: 'true',
      SWAGGER_USERNAME: 'swagger',
      SWAGGER_PASSWORD: 'secret',
    });

    app = await createHttpApp(appConfig);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('protects swagger docs with basic auth', () => {
    return request(app.getHttpServer())
      .get('/docs/iam')
      .expect(401)
      .expect('WWW-Authenticate', 'Basic realm="Swagger Docs"');
  });

  it('serves the IAM swagger document when credentials are valid', () => {
    return request(app.getHttpServer())
      .get('/docs/iam-json')
      .auth('swagger', 'secret')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          paths: Record<string, unknown>;
          components?: {
            securitySchemes?: Record<string, unknown>;
            schemas?: Record<
              string,
              {
                properties?: Record<string, { example?: unknown }>;
              }
            >;
          };
        };

        expect(body.paths['/auth/login']).toBeDefined();
        expect(body.paths['/auth/refresh']).toBeDefined();
        expect(body.paths['/auth/logout']).toBeDefined();
        expect(body.paths['/auth/me']).toBeDefined();
        expect(body.paths['/admin/users']).toBeUndefined();
        expect(body.paths['/todos']).toBeUndefined();
        expect(
          body.components?.securitySchemes?.['access-token'],
        ).toBeDefined();
        expect(
          body.components?.securitySchemes?.['refresh-token'],
        ).toBeDefined();
        expect(
          body.components?.schemas?.LoginBody?.properties?.email?.example,
        ).toBe('architect@example.com');
      });
  });

  it('serves the Admin swagger document when credentials are valid', () => {
    return request(app.getHttpServer())
      .get('/docs/admin-json')
      .auth('swagger', 'secret')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          paths: Record<string, unknown>;
          components?: {
            schemas?: Record<
              string,
              {
                properties?: Record<string, { example?: unknown }>;
              }
            >;
          };
        };

        expect(body.paths['/admin/users']).toBeDefined();
        expect(body.paths['/admin/users/{userId}']).toBeDefined();
        expect(body.paths['/admin/users/{userId}/roles']).toBeDefined();
        expect(body.paths['/admin/users/{userId}/status']).toBeDefined();
        expect(body.paths['/admin/roles']).toBeDefined();
        expect(body.paths['/admin/permissions']).toBeDefined();
        expect(body.paths['/admin/data-resets']).toBeDefined();
        expect(body.paths['/auth/login']).toBeUndefined();
        expect(body.paths['/todos']).toBeUndefined();
        expect(
          body.components?.schemas?.CreateAdminDataResetBody?.properties?.mode
            ?.example,
        ).toBe('reset_to_demo_baseline');
      });
  });

  it('serves the Todo swagger document when credentials are valid', () => {
    return request(app.getHttpServer())
      .get('/docs/todo-json')
      .auth('swagger', 'secret')
      .expect(200)
      .expect((response: Response) => {
        const body = response.body as {
          paths: Record<string, unknown>;
          components?: {
            schemas?: Record<
              string,
              {
                properties?: Record<
                  string,
                  {
                    example?: unknown;
                    properties?: Record<string, { example?: unknown }>;
                  }
                >;
              }
            >;
          };
        };
        const todosPath = body.paths['/todos'] as {
          get?: {
            parameters?: Array<{
              name?: string;
            }>;
          };
        };
        const todoListQueryParams =
          todosPath.get?.parameters?.map((parameter) => parameter.name) ?? [];

        expect(body.paths['/todos']).toBeDefined();
        expect(body.paths['/todos/{todoId}']).toBeDefined();
        expect(body.paths['/users/{userId}/todos']).toBeUndefined();
        expect(body.paths['/users/{userId}/todos/{todoId}']).toBeUndefined();
        expect(body.paths['/auth/login']).toBeDefined();
        expect(body.paths['/auth/me']).toBeDefined();
        expect(body.paths['/auth/refresh']).toBeUndefined();
        expect(body.paths['/auth/logout']).toBeUndefined();
        expect(body.paths['/admin/users']).toBeUndefined();
        expect(todoListQueryParams).toEqual(
          expect.arrayContaining(['isCompleted', 'search', 'page', 'limit']),
        );
        expect(
          body.components?.schemas?.CreateTodoBody?.properties?.title?.example,
        ).toBe('Write API docs');
        expect(
          body.components?.schemas?.ListUserTodosHttpResponse?.properties?.meta
            ?.example,
        ).toEqual({
          page: 1,
          limit: 10,
          totalItems: 24,
          totalPages: 3,
        });
        expect(
          body.components?.schemas?.ListUserTodosResponse?.properties?.page,
        ).toBeUndefined();
        expect(
          body.components?.schemas?.ListUserTodosResponse?.properties?.meta,
        ).toBeUndefined();
        expect(
          body.components?.schemas?.ListUserTodosHttpResponse?.properties?.data
            ?.example,
        ).toBeUndefined();
        expect(
          body.components?.schemas?.ListUserTodosHttpResponse?.properties?.meta
            ?.properties?.totalPages?.example,
        ).toBe(3);
        expect(body.components?.schemas?.HttpErrorResponse).toBeDefined();
      });
  });

  it('requires bearer auth for protected endpoints', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect((response: Response) => {
        expect(response.body).toMatchObject({
          success: false,
          statusCode: 401,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Access token is required.',
          },
          path: '/auth/me',
        });
        expect(response.body.timestamp).toEqual(expect.any(String));
      });
    await request(app.getHttpServer())
      .post('/admin/users')
      .send({
        email: 'architect@example.com',
        password: 'strong-password-123',
      })
      .expect(401);
    await request(app.getHttpServer())
      .post('/todos')
      .send({
        title: 'Write API docs',
      })
      .expect(401);
  });
});

describe('Removed per-user data routes (e2e)', () => {
  let app: INestApplication;
  const itemId = '1b7d4f4e-6a3a-4c53-8f1e-2f4e9a0c9d11';
  const collections = [
    'todos',
    'notes',
    'contacts',
    'books',
    'movies',
    'transactions',
  ];

  beforeEach(async () => {
    app = await createHttpApp(loadAppConfig(createBaseEnv()));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe.each(collections)('%s', (collection) => {
    it('responds not found for every former per-user route', async () => {
      const server = app.getHttpServer();
      const base = `/users/${TEST_USER_ID}/${collection}`;
      const item = `${base}/${itemId}`;

      await request(server).get(base).expect(404);
      await request(server).post(base).send({}).expect(404);
      await request(server).get(item).expect(404);
      await request(server).patch(item).send({}).expect(404);
      await request(server).delete(item).expect(404);
    });

    it('keeps the authenticated routes behind a token', async () => {
      const server = app.getHttpServer();
      const base = `/${collection}`;

      await request(server).get(base).expect(401);
      await request(server).post(base).send({}).expect(401);
      await request(server).get(`${base}/${itemId}`).expect(401);
      await request(server).patch(`${base}/${itemId}`).send({}).expect(401);
      await request(server).delete(`${base}/${itemId}`).expect(401);
    });
  });
});

describe('Swagger disabled (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const appConfig = loadAppConfig({
      ...createBaseEnv(),
      SWAGGER_ENABLED: 'false',
    });
    app = await createHttpApp(appConfig);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('does not mount swagger routes when disabled', () => {
    return request(app.getHttpServer()).get('/docs/iam').expect(404);
  });
});
