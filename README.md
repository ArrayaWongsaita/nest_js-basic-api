# Nest JS API

NestJS monolith starter that follows clean architecture with bounded contexts.

## Required Environment

The auth-enabled application will not boot unless the JWT secret is configured.

Minimum local setup:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/nest_js_api

JWT_ACCESS_SECRET=change-me-access-secret
JWT_ACCESS_TTL=15m
AUTH_REFRESH_COOKIE_NAME=refresh_token
AUTH_REFRESH_TTL=30d

SWAGGER_ENABLED=true
SWAGGER_USERNAME=swagger
SWAGGER_PASSWORD=change-me
```

Optional values:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3001
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=change-me-admin-password
```

## HTTP Response Contract

All JSON endpoints use one shared envelope:

- Success: `{ "success": true, "data": ..., "meta"?: ... }`
- Error: `{ "success": false, "error": ..., "path": "...", "timestamp": "...", "statusCode": ... }`

Response classes:

- JSON endpoints always return the shared success or error envelope.
- `204 No Content` endpoints intentionally return no response body.

Example success response from `GET /health`:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "api",
    "timestamp": "2026-05-26T08:30:00.000Z"
  }
}
```

Example error response for a validation failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [
      {
        "path": "userId",
        "code": "invalid_format",
        "message": "Invalid UUID"
      }
    ]
  },
  "path": "/users/not-a-uuid/todos",
  "timestamp": "2026-05-26T08:30:00.000Z",
  "statusCode": 400
}
```

## Auth

The project now exposes product-style IAM auth:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Access tokens are returned in JSON and must be sent as `Bearer` tokens on protected routes. Refresh tokens are stored only in an `HttpOnly` cookie.

### Bootstrap the first admin

Seed the initial roles, permissions, and admin user with:

```bash
npm run bootstrap:auth-admin
```

This command regenerates the Prisma client before bootstrapping so the runtime client stays aligned with the current Prisma schema.

If bootstrap fails with a missing column or other schema-drift error, sync the database first:

```bash
pnpm run prisma:db:push
```

Required env values:

```env
JWT_ACCESS_SECRET=change-me-access-secret
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=change-me-admin-password
```

### Seed demo student users

When the API is running, an admin can seed the baseline IAM data plus the demo student accounts through:

- `POST /admin/demo-user-seeds`

This maintenance endpoint requires:

- a valid Bearer access token
- the `system.reset.any` permission

It reconciles:

- baseline IAM roles and permissions
- `student1@mail.com` through `student60@mail.com`
- active, non-system users assigned only the `student` role

It does not seed:

- `todo` records
- `note` records
- `contact` records

Shared demo password:

- `1234567891011`

If the database schema is behind the current Prisma schema, the endpoint fails fast and instructs the operator to run:

```bash
pnpm run prisma:db:push
```

For CLI-based maintenance, the same demo-user seed remains available with:

```bash
npm run bootstrap:demo-users
```

This command also regenerates the Prisma client first, so seed scripts do not depend on previously generated Prisma artifacts.

If your local database schema is behind the current Prisma schema, run:

```bash
pnpm run prisma:db:push
```

Required env values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nest_js_api
JWT_ACCESS_SECRET=change-me-access-secret
```

Optional env values:

```env
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=change-me-admin-password
```

### Auth Flow Notes

- `POST /auth/login` returns the shared JSON success envelope and sets the refresh cookie.
- `POST /auth/refresh` reads the refresh cookie, rotates the session, and returns the shared JSON success envelope.
- `POST /auth/logout` clears the refresh cookie, revokes the active refresh session, and returns `204 No Content`.
- `GET /auth/me` requires `Authorization: Bearer <access-token>`.
- `POST /users` is administrative onboarding, not public sign-up.

## Swagger Docs

The project exposes Swagger as separate documents by domain:

- `/docs/iam`
- `/docs/admin`
- `/docs/todo`

Swagger routes are protected with Basic Auth. Configure them through environment variables:

```env
SWAGGER_ENABLED=true
SWAGGER_USERNAME=swagger
SWAGGER_PASSWORD=change-me
```

If `SWAGGER_ENABLED=false`, the docs routes are not mounted and will return `404`.

## Swagger Conventions

This project uses `nestjs-zod` for request validation, response schemas, and OpenAPI generation.

- Field descriptions and example values live on Zod DTO fields.
- Swagger should use one canonical field-level example from DTO metadata first, not per-endpoint overrides.
- Controller methods should use composite docs decorators to keep transport metadata concise.
- Swagger documents reflect the shared success envelope DTOs and the centralized error response schema.

Current composite decorators:

- `ApiCreateEndpointDocs`
- `ApiListEndpointDocs`
- `ApiReadEndpointDocs`
- `ApiUpdateEndpointDocs`
- `ApiDeleteEndpointDocs`

They wrap repeated Swagger concerns such as:

- `ApiOperation`
- shared bad-request and internal-error response documentation
- `ZodResponse`

Additional endpoint-specific responses such as `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, and `409 Conflict` can still be attached where needed.

## Current Domain APIs

### IAM

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /users` (legacy admin onboarding)

### Admin

- `GET /admin/users`
- `GET /admin/users/:userId`
- `POST /admin/users`
- `PATCH /admin/users/:userId/roles`
- `PATCH /admin/users/:userId/status`
- `GET /admin/roles`
- `POST /admin/roles`
- `PATCH /admin/roles/:roleId`
- `DELETE /admin/roles/:roleId`
- `GET /admin/permissions`
- `POST /admin/permissions`
- `PATCH /admin/permissions/:permissionId`
- `DELETE /admin/permissions/:permissionId`
- `POST /admin/data-resets`
- `POST /admin/demo-user-seeds`

### Todo

- `POST /todos`
- `GET /todos`
- `GET /todos/:todoId`
- `PATCH /todos/:todoId`
- `DELETE /todos/:todoId`

These authenticated Todo routes derive the owner from the access token. Clients must not send `userId` for Todo ownership.

List routes support shared query controls:

- `isCompleted=true|false`
- `search=<text>`
- `page=<1-based page number>`
- `limit=<1-100>`

The authenticated mode and the by-user-id mode share the same list query contract and the same paginated response shape.

Example request:

```http
GET /todos?isCompleted=false&search=lesson&page=2&limit=10
```

Example response:

```json
{
  "success": true,
  "data": {
    "userId": "8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1",
    "items": [
      {
        "id": "42d7e12c-1e63-4fc6-a1a8-9779fd7f735d",
        "userId": "8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1",
        "title": "Write API docs",
        "description": "Describe every field in Swagger.",
        "isCompleted": false,
        "dueDate": "2026-06-01T09:00:00.000Z",
        "createdAt": "2026-05-25T14:30:00.000Z",
        "updatedAt": "2026-05-25T14:30:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 2,
    "limit": 10,
    "totalItems": 24,
    "totalPages": 3
  }
}
```

List responses are paginated and return:

- `data.userId`
- `data.items`
- `meta.page`
- `meta.limit`
- `meta.totalItems`
- `meta.totalPages`

### Todo Demo By User ID

- `POST /users/:userId/todos`
- `GET /users/:userId/todos`
- `GET /users/:userId/todos/:todoId`
- `PATCH /users/:userId/todos/:todoId`
- `DELETE /users/:userId/todos/:todoId`

These routes are public runtime demo APIs intended for easy Swagger exploration. They identify the owner directly from the `userId` route parameter and do not require a Bearer token.

The same list query contract and success-envelope shape also apply here.

Example:

```http
GET /users/8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1/todos?search=essay&page=1&limit=20
```

The `/docs/todo` Swagger page also includes:

- `POST /auth/login`
- `GET /auth/me`

This allows you to log in from the Todo docs and inspect the current IAM user's `userId` from the same page.
