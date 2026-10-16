# API Reference

Hand-written reference for every HTTP endpoint of the running application. It was written against the controllers, request/response schemas, guards and permission constants in `src/`. Swagger (when `SWAGGER_ENABLED=true`) remains the deeper schema source.

- [Conventions](#conventions)
- [Permissions](#permissions)
- [Health](#health)
- [Auth](#auth)
- [Admin: users](#admin-users)
- [Admin: roles](#admin-roles)
- [Admin: permissions](#admin-permissions)
- [Admin: audit logs](#admin-audit-logs)
- [Admin: maintenance (data reset, demo seed)](#admin-maintenance)
- [Own data routes (six domains)](#own-data-routes)
- [Admin cross-user routes (six domains)](#admin-cross-user-routes)
- [Domains without an API](#domains-without-an-api)
- [Endpoint index](#endpoint-index)

## Conventions

### Terms

- **administrator**: a system user holding the `admin` system role.
- **system role**: a role flagged `isSystem` (`admin`, `student`). It cannot be renamed, have its permissions edited, or be deleted through the API.
- **system user**: a user flagged `isSystem`. It cannot be deactivated or deleted.
- **own data vs any data**: `*_own` permissions apply to the caller's own records through the plain domain routes (`/todos`, ...). `*_any` permissions apply to another user's records through `/admin/users/:userId/...`.
- **session**: the refresh-token session stored for a user (one per user) plus the short-lived access token. Ending a session deletes the refresh session; an already issued access token keeps working until it expires (default 10 minutes).
- **soft-deleted user**: a user with a non-null `deletedAt`. They cannot sign in and are hidden from the default user list; their data is retained and the user can be restored.
- **audit entry**: a record of an administrative action (who, what, target, outcome, time).

### Base URL and format

There is no global route prefix. All paths below are relative to the server root (default port `3000`). Requests and responses are JSON (`Content-Type: application/json`), except `204 No Content` responses, which have no body.

### Success envelope

```json
{ "success": true, "data": { }, "meta": { } }
```

`meta` is present only on paginated lists: `{ "page": 1, "limit": 10, "totalItems": 24, "totalPages": 3 }`.

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [{ "path": "limit", "code": "too_big", "message": "..." }]
  },
  "path": "/todos?limit=500",
  "timestamp": "2026-05-26T08:30:00.000Z",
  "statusCode": 400
}
```

`details` is present only for validation errors. Error codes:

| code | HTTP status | Meaning |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | Request rejected by a business rule (for example wrong current password) |
| `VALIDATION_ERROR` | 400 | Body, query or route params failed schema validation (`details` filled) |
| `UNAUTHORIZED` | 401 | Missing, malformed, invalid or expired credentials |
| `FORBIDDEN` | 403 | Valid token but missing permission, or password change required |
| `NOT_FOUND` | 404 | Resource does not exist (or is not owned by the caller) |
| `CONFLICT` | 409 | State conflict or violated safety rule |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Authentication

Every route is protected by a global guard unless marked **Public** below.

- Send `Authorization: Bearer <accessToken>`. The access token is a signed JWT verified without a database read. Its lifetime is `JWT_ACCESS_TTL` (default `10m`, maximum `15m`).
- The refresh token is an opaque value stored only in an `HttpOnly` cookie (name `AUTH_REFRESH_COOKIE_NAME`, default `refresh_token`, `Path=/`, `SameSite=None`, `Secure` in production, lifetime `AUTH_REFRESH_TTL`, default `30d`). It is never returned in JSON.
- Missing or invalid Bearer token: `401 UNAUTHORIZED` ("Access token is required." or "Access token is invalid or expired.").
- Missing a required permission: `403 FORBIDDEN` ("You do not have permission to access this resource."). All required permissions listed for a route must be present in the token.
- Permissions are embedded in the access token at sign-in or refresh. A role change takes effect after the user's session ends and they sign in again (see [Admin: users](#admin-users)).

#### Forced password change gating

When an administrator resets a password, the user's next sign-in returns `mustChangePassword: true` and the access token carries that flag. A token with the flag may call only `POST /auth/change-password`. Every other protected route (including `GET /auth/me`) answers `403 FORBIDDEN` with "You must change your password before using this resource." Changing the password clears the flag and ends the session, so the user signs in again with the new password.

### Pagination

Paginated lists accept `page` (integer >= 1, default `1`) and `limit` (integer 1-100). Default `limit` is `10` for domain lists and `20` for admin user and audit lists.

### Identifiers

All identifiers in route params are UUIDs. A non-UUID value yields `400 VALIDATION_ERROR`.

## Permissions

Defined in `src/contexts/iam/domain/constants/permission-name.constants.ts`.

| Group | Permissions |
| --- | --- |
| Users | `iam.users.create`, `iam.users.read`, `iam.users.update_roles`, `iam.users.deactivate`, `iam.users.reset_password`, `iam.users.delete`, `iam.users.restore` |
| Roles | `iam.roles.read`, `iam.roles.create`, `iam.roles.update`, `iam.roles.delete` |
| Permissions | `iam.permissions.read`, `iam.permissions.create`, `iam.permissions.update`, `iam.permissions.delete` |
| Audit | `iam.audit_logs.read` |
| Maintenance | `system.reset.any` |
| Own data, per domain `todo`, `note`, `contact`, `book`, `movie`, `expense` | `<domain>.create_own`, `<domain>.read_own`, `<domain>.update_own`, `<domain>.delete_own` |
| Any data, per same six domains | `<domain>.read_any`, `<domain>.delete_any` |

Default grants (`src/contexts/iam/domain/constants/role-permission-map.ts`):

- `admin` system role: every permission above.
- `student` system role: the four `*_own` permissions of all six domains, nothing else.

## Health

### GET /health

- Auth: **Public**
- Permission: none
- Request: none
- Response `200`:

```json
{ "success": true, "data": { "status": "ok", "service": "api", "timestamp": "2026-05-26T08:30:00.000Z" } }
```

- Errors: none expected.
- Example: `curl http://localhost:3000/health`

There is no root (`/`) route; requesting it returns `404 NOT_FOUND`.

## Auth

### POST /auth/login

- Auth: **Public**
- Permission: none
- Body:

| field | type | rules |
| --- | --- | --- |
| `email` | string | valid email |
| `password` | string | min 12 characters |

- Response `200`: sets the refresh cookie and returns

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresInSeconds": 600,
    "mustChangePassword": false,
    "user": {
      "userId": "6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31",
      "email": "architect@example.com",
      "roles": ["student"],
      "permissions": ["todo.create_own", "todo.read_own"]
    }
  }
}
```

Signing in replaces any previous session of the user.

- Errors:
  - `400 VALIDATION_ERROR`: invalid body.
  - `401 UNAUTHORIZED`: "Invalid email or password." (unknown email, wrong password, or soft-deleted user) or "User account is inactive."
- Example:

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"architect@example.com","password":"strong-password-123"}'
```

### POST /auth/refresh

- Auth: **Public**, but requires the refresh cookie.
- Permission: none
- Request: no body; cookie `refresh_token` (or the configured name).
- Response `200`: same shape as login. The refresh token is rotated and a new cookie is set.
- Errors:
  - `401 UNAUTHORIZED`: "Refresh session is missing." (no cookie), "Refresh session is invalid or expired." (unknown, expired, ended session, or soft-deleted user) or "User account is inactive."
- Example: `curl -i -X POST http://localhost:3000/auth/refresh --cookie 'refresh_token=<token>'`

### POST /auth/logout

- Auth: **Public**
- Permission: none
- Request: no body; refresh cookie (optional).
- Response `204`, no body. The refresh session is ended and the cookie is cleared. Succeeds even without a cookie.
- Errors: none expected.
- Example: `curl -i -X POST http://localhost:3000/auth/logout --cookie 'refresh_token=<token>'`

### GET /auth/me

- Auth: Bearer access token
- Permission: none (any signed-in user). Rejected with `403` while a forced password change is pending.
- Response `200`: `data` is `{ userId, email, roles, permissions }` (same as `user` in login).
- Errors: `401 UNAUTHORIZED` (invalid token or "Authenticated user was not found."), `403 FORBIDDEN` (password change pending).
- Example: `curl http://localhost:3000/auth/me -H 'Authorization: Bearer <token>'`

### POST /auth/change-password

Self-service password change, and the only route usable while `mustChangePassword` is true.

- Auth: Bearer access token (a token flagged `mustChangePassword` is accepted here)
- Permission: none
- Body:

| field | type | rules |
| --- | --- | --- |
| `currentPassword` | string | min 1; must match the current password |
| `newPassword` | string | min 1 in the schema; the password policy then requires at least 12 characters (same as registration); must differ from the current password |

- Response `204`, no body. The must-change flag is cleared, the user's session is ended and the refresh cookie is cleared. Sign in again with the new password.
- Errors:
  - `400 VALIDATION_ERROR`: invalid body.
  - `400 BAD_REQUEST`: "Current password is incorrect.", "Password must be at least 12 characters long.", "New password must differ from the current password.", or "User was not found." (inactive user).
  - `401 UNAUTHORIZED`: invalid token.
- Example:

```bash
curl -i -X POST http://localhost:3000/auth/change-password \
  -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' \
  -d '{"currentPassword":"strong-password-123","newPassword":"a-new-strong-password-456"}'
```

### POST /users (register a user)

There is no public self-registration. `POST /users` is the administrative onboarding route (same effect as `POST /admin/users`).

- Auth: Bearer access token
- Permission: `iam.users.create`
- Body:

| field | type | rules |
| --- | --- | --- |
| `email` | string | valid email, unique |
| `password` | string | min 12 characters |
| `roles` | array of `"admin"` or `"student"` | optional; default `[]`, which results in the `student` role |

- Response `201`: `data` is `{ userId, email, roles: string[] }`.
- Errors: `400 VALIDATION_ERROR`, `401`, `403`, `409 CONFLICT` ("User already exists.").
- Example:

```bash
curl -X POST http://localhost:3000/users -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"new@example.com","password":"strong-password-123","roles":["student"]}'
```

## Admin: users

All routes require a Bearer token and the listed permission. User object (`AdminUser`):

```json
{
  "userId": "8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1",
  "email": "learner@example.com",
  "isActive": true,
  "isSystem": false,
  "deletedAt": null,
  "roles": [{ "id": "6a4f4c57-5a12-4c6b-a9a5-9b9a2f8b5c31", "name": "student", "isSystem": true }],
  "createdAt": "2026-05-26T08:30:00.000Z",
  "updatedAt": "2026-05-26T08:30:00.000Z"
}
```

Admin safety rules (apply to status change, role change and delete; violations return `409 CONFLICT` and are recorded as `rejected` audit entries):

- An administrator cannot deactivate, remove their own `admin` role from, or delete their own account.
- The number of active administrators can never reach zero.
- System users cannot be deactivated or deleted.

Session end: deactivation, role change, soft delete and password reset each delete the target user's refresh session. Their existing access token remains valid until it expires (at most `JWT_ACCESS_TTL`).

### GET /admin/users

- Permission: `iam.users.read`
- Query:

| param | type | notes |
| --- | --- | --- |
| `search` | string | case-insensitive email text |
| `isActive` | `true` or `false` | active-state filter (status) |
| `roleName` | string | exact role name (for example `student`); unknown role gives an empty list |
| `includeDeleted` | `true` or `false` | include soft-deleted users; default `false` (hidden) |
| `page` | integer | default 1 |
| `limit` | integer 1-100 | default 20 |

- Response `200`: `data` is an array of `AdminUser`; `meta` is `{ page, limit, totalItems, totalPages }`.
- Errors: `400 VALIDATION_ERROR`, `401`, `403`.
- Example: `curl 'http://localhost:3000/admin/users?roleName=student&isActive=true&includeDeleted=false&page=1' -H 'Authorization: Bearer <token>'`

### GET /admin/users/:userId

- Permission: `iam.users.read`
- Response `200`: `data` is an `AdminUser` (soft-deleted users are returned with `deletedAt` set).
- Errors: `400` (non-UUID), `401`, `403`, `404` ("User was not found.").

### POST /admin/users

- Permission: `iam.users.create`
- Body: `email` (valid email), `password` (min 12), `roleNames` (string array, optional, default `[]`; empty results in `student`).
- Response `201`: `data` is an `AdminUser`.
- Errors: `400`, `401`, `403`, `409` ("User already exists." or `Role "<name>" was not found.`).
- Example: `curl -X POST http://localhost:3000/admin/users -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"email":"learner@example.com","password":"strong-password-123","roleNames":["student"]}'`

### PATCH /admin/users/:userId/roles

Replaces the full role set and ends the user's session.

- Permission: `iam.users.update_roles`
- Body: `{ "roleNames": ["student", "mentor"] }` (non-empty array of role names).
- Response `200`: `data` is the updated `AdminUser`.
- Errors: `400`, `401`, `403`, `404` ("User was not found."), `409` (unknown role name, "Admins cannot remove the admin role from their own account.", "The last active admin cannot lose the admin role.").

### PATCH /admin/users/:userId/status

Activates or deactivates the user. Deactivation ends the user's session and blocks sign-in and refresh.

- Permission: `iam.users.deactivate`
- Body: `{ "isActive": false }`
- Response `200`: `data` is the updated `AdminUser`.
- Errors: `400`, `401`, `403`, `404`, `409` ("System users cannot be deactivated.", "Admins cannot deactivate their own account.", "The last active admin cannot be deactivated.").
- Example: `curl -X PATCH http://localhost:3000/admin/users/<id>/status -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"isActive":false}'`

### DELETE /admin/users/:userId

Soft delete. Sets `deletedAt`, ends the user's session, hides the user from the default list and blocks sign-in. Data is retained. There is no hard delete.

- Permission: `iam.users.delete`
- Response `200` (not 204): `data` is the `AdminUser` with `deletedAt` set.
- Errors: `400`, `401`, `403`, `404`, `409` ("User is already deleted.", "System users cannot be deleted.", "Admins cannot delete their own account.", "The last active admin cannot be deleted.").

### POST /admin/users/:userId/restore

- Permission: `iam.users.restore`
- Request: no body.
- Response `200`: `data` is the restored `AdminUser` (`deletedAt: null`).
- Errors: `400`, `401`, `403`, `404`, `409` ("User is not deleted.").

### POST /admin/users/:userId/password-reset

Generates a temporary password, returns it once, sets the must-change flag and ends the user's session. At next sign-in the user is limited to `POST /auth/change-password`.

- Permission: `iam.users.reset_password`
- Request: no body.
- Response `200`:

```json
{ "success": true, "data": { "userId": "8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1", "temporaryPassword": "k3Jf9x_Qw2Zr8vLmN4pT7yB1cD5eG6hA" } }
```

- Errors: `400`, `401`, `403`, `404` ("User was not found.").

## Admin: roles

Role object: `{ id, name, isSystem, permissions: [{ id, name, isSystem }] }`.

### GET /admin/roles

- Permission: `iam.roles.read`
- Response `200`: `data` is an array of roles (system and custom).
- Errors: `401`, `403`.

### POST /admin/roles

- Permission: `iam.roles.create`
- Body: `name` (string, min 1), `permissionNames` (string array, default `[]`).
- Response `201`: `data` is the created role (custom, `isSystem: false`).
- Errors: `400`, `401`, `403`, `409` ("Role already exists." or `Permission "<name>" was not found.`).
- Example: `curl -X POST http://localhost:3000/admin/roles -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"name":"mentor","permissionNames":["todo.read_own"]}'`

### PATCH /admin/roles/:roleId

Replaces the name and the full permission set of a custom role.

- Permission: `iam.roles.update`
- Body: same as create (`name`, `permissionNames`).
- Response `200`: `data` is the updated role.
- Errors: `400`, `401`, `403`, `404` ("Role was not found."), `409` ("System roles cannot be modified.", "Role already exists.", unknown permission name).

### DELETE /admin/roles/:roleId

- Permission: `iam.roles.delete`
- Response `204`, no body.
- Errors: `400`, `401`, `403`, `404`, `409` ("System roles cannot be deleted.", "Role cannot be deleted while it is assigned.").

## Admin: permissions

Permission object: `{ id, name, isSystem }`.

### GET /admin/permissions

- Permission: `iam.permissions.read`
- Response `200`: `data` is an array of permissions.
- Errors: `401`, `403`.

### POST /admin/permissions

- Permission: `iam.permissions.create`
- Body: `{ "name": "todo.export" }`
- Response `201`: `data` is the created permission.
- Errors: `400`, `401`, `403`, `409` ("Permission already exists.").

### PATCH /admin/permissions/:permissionId

- Permission: `iam.permissions.update`
- Body: `{ "name": "..." }`
- Response `200`: `data` is the updated permission.
- Errors: `400`, `401`, `403`, `404` ("Permission was not found."), `409` ("System permissions cannot be modified.", "Permission already exists.").

### DELETE /admin/permissions/:permissionId

- Permission: `iam.permissions.delete`
- Response `204`, no body.
- Errors: `400`, `401`, `403`, `404`, `409` ("System permissions cannot be deleted.", "Permission cannot be deleted while it is assigned to roles.").

## Admin: audit logs

### GET /admin/audit-logs

Read-only, newest first. Includes actions rejected by a safety rule (`outcome: "rejected"`). There are no create, update or delete routes for audit entries.

- Permission: `iam.audit_logs.read`
- Query (all optional):

| param | type | notes |
| --- | --- | --- |
| `actorUserId` | string | acting administrator |
| `action` | string | exact action name |
| `targetType` | string | for example `user` |
| `targetId` | string | target identifier |
| `from` | ISO 8601 datetime with offset | inclusive lower bound |
| `to` | ISO 8601 datetime with offset | inclusive upper bound |
| `page` | integer | default 1 |
| `limit` | integer 1-100 | default 20 |

- Response `200`: `data` is an array of audit entries; `meta` is `{ page, limit, totalItems, totalPages }`.

```json
{
  "id": "2f0c6c6e-6c1e-4e0e-9a5b-6c2a1d3f4b5a",
  "actorUserId": "8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1",
  "action": "user.status_changed",
  "targetType": "user",
  "targetId": "1b3f0a52-6a3e-4a67-9f0c-0d6c3d2a9a11",
  "outcome": "success",
  "details": { "isActive": false },
  "createdAt": "2026-05-26T08:30:00.000Z"
}
```

`outcome` is `success` or `rejected`. `details` never contains secrets; rejected entries carry a reason.

- Action names: `user.status_changed`, `user.password_reset`, `user.roles_changed`, `user.deleted`, `user.restored`, `role.created`, `role.updated`, `role.deleted`, `permission.created`, `permission.updated`, `permission.deleted`, `system.data_reset`, `system.demo_seed`, `todo.deleted_by_admin`, `note.deleted_by_admin`, `contact.deleted_by_admin`, `book.deleted_by_admin`, `movie.deleted_by_admin`, `expense.deleted_by_admin`.
- Target types: `user`, `role`, `permission`, `system`, `todo`, `note`, `contact`, `book`, `movie`, `expense`.
- Errors: `400 VALIDATION_ERROR`, `401`, `403`.
- Example: `curl 'http://localhost:3000/admin/audit-logs?action=user.deleted&from=2026-05-01T00:00:00.000Z' -H 'Authorization: Bearer <token>'`

## Admin: maintenance

Both routes require `system.reset.any` and are **disabled in production** (`NODE_ENV=production`) unless the environment setting `ADMIN_MAINTENANCE_ALLOW_IN_PRODUCTION=true` is set (default `false`). When blocked, they return `409 CONFLICT` with the message "This maintenance operation is disabled in production. Set ADMIN_MAINTENANCE_ALLOW_IN_PRODUCTION=true to enable it." Outside production they work unchanged. Both actions are recorded as audit entries.

### POST /admin/data-resets

Synchronous, irreversible reset of demo data. System users, roles and permissions are preserved.

- Permission: `system.reset.any`
- Body:

| field | type | rules |
| --- | --- | --- |
| `scope` | `"user"` or `"global"` | required |
| `targetUserId` | UUID | required when `scope` is `user` |
| `domains` | array of `"iam"`, `"todo"`, `"all"` | min 1 item |
| `mode` | `"reset_to_demo_baseline"` | required literal |
| `reason` | string | optional, min 1 after trim |

- Response `200`:

```json
{
  "success": true,
  "data": {
    "scope": "global",
    "targetUserId": null,
    "domains": ["todo", "iam"],
    "mode": "reset_to_demo_baseline",
    "reason": null,
    "domainResults": [{ "domain": "todo", "deletedRecords": 12, "preservedRecords": 0 }],
    "preservedSystemRecords": { "users": 1, "roles": 2, "permissions": 14 },
    "completedAt": "2026-05-26T08:30:00.000Z"
  }
}
```

- Errors: `400 VALIDATION_ERROR`, `401`, `403`, `409` (production guard, "targetUserId is required for user-scoped resets.", "User was not found.", "System users cannot be reset through IAM reset.", `Reset domain "<name>" is not supported.`, "At least one reset domain must be selected.").
- Example: `curl -X POST http://localhost:3000/admin/data-resets -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"scope":"global","domains":["all"],"mode":"reset_to_demo_baseline"}'`

### POST /admin/demo-user-seeds

Reconciles baseline IAM data and the demo student accounts `student1@mail.com` through `student60@mail.com` (active, non-system, `student` role only; the shared demo password is documented in the README).

- Permission: `system.reset.any`
- Request: no body.
- Response `200`: `data` is `{ totalUsers: 60, firstEmail, lastEmail, roleName: "student", completedAt }`.
- Errors: `401`, `403`, `409` (production guard, or database schema behind the Prisma schema).
- Example: `curl -X POST http://localhost:3000/admin/demo-user-seeds -H 'Authorization: Bearer <token>'`

## Own data routes

Six domains, each with the same five operations on the caller's own records. The owner is always the user in the token; no user id is accepted. Another user's record id yields `404`. Common errors for every route below: `401` (invalid token), `403` (missing permission), `400 VALIDATION_ERROR` (invalid params, query or body). Single-record routes add `404 NOT_FOUND`.

| Operation | Method and path | Permission | Success |
| --- | --- | --- | --- |
| Create | `POST /<base>` | `<domain>.create_own` | `201`, `data` is the record |
| List | `GET /<base>` | `<domain>.read_own` | `200`, `data` is `{ userId, items: [record] }`, `meta` is pagination |
| Read one | `GET /<base>/:<domain>Id` | `<domain>.read_own` | `200`, `data` is the record |
| Update | `PATCH /<base>/:<domain>Id` | `<domain>.update_own` | `200`, `data` is the record |
| Delete | `DELETE /<base>/:<domain>Id` | `<domain>.delete_own` | `204`, no body |

| Domain | Base path | Id param | Not-found message |
| --- | --- | --- | --- |
| todo | `/todos` | `todoId` | "Todo item was not found." |
| note | `/notes` | `noteId` | "Note item was not found." |
| contact | `/contacts` | `contactId` | "Contact was not found." |
| book | `/books` | `bookId` | "Book was not found." |
| movie | `/movies` | `movieId` | "Movie was not found." |
| expense | `/transactions` | `expenseId` | "Expense was not found." |

Update requests must contain at least one field (otherwise `400 VALIDATION_ERROR`, "At least one field must be provided."). Optional nullable fields (written as "string or null" below) are normalised to `null` by the request schema when omitted from the body, so a `PATCH` that leaves one out also clears it on the stored record. Send the current value for every nullable field you want to keep.

List query parameters common to all domains: `page` (default 1), `limit` (1-100, default 10), `search` (trimmed, min 1, case-insensitive text filter). Extra filters are listed per domain.

Every record contains `id`, `userId`, `createdAt`, `updatedAt` (ISO 8601) plus the domain fields below.

### Todos (`/todos`)

- Create body: `title` (string, min 1, required), `description` (string min 1 or null, optional), `dueDate` (ISO 8601 with offset, or null, optional).
- Update body: `title`, `description`, `isCompleted` (boolean), `dueDate`; all optional, at least one required.
- List filters: `isCompleted` (`true` or `false`), `search`.
- Record fields: `title`, `description` (string or null), `isCompleted`, `dueDate` (string or null).

```bash
curl -X POST http://localhost:3000/todos -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' -d '{"title":"Write API docs","dueDate":"2026-06-01T09:00:00.000Z"}'
```

```json
{
  "success": true,
  "data": {
    "id": "42d7e12c-1e63-4fc6-a1a8-9779fd7f735d",
    "userId": "8f8da2a4-2dd1-4c3c-80cb-0cc371c43ec1",
    "title": "Write API docs",
    "description": null,
    "isCompleted": false,
    "dueDate": "2026-06-01T09:00:00.000Z",
    "createdAt": "2026-05-25T14:30:00.000Z",
    "updatedAt": "2026-05-25T14:30:00.000Z"
  }
}
```

### Notes (`/notes`)

- Create body: `title` (string min 1), `content` (string min 1), both required.
- Update body: `title`, `content`; optional, at least one required.
- List filters: `search`.
- Record fields: `title`, `content`.

### Contacts (`/contacts`)

- Create body: `firstName` (string min 1, required); `lastName`, `email`, `phone`, `company`, `address` (each string min 1 or null, optional).
- Update body: any of the same fields (`firstName` cannot be null), at least one required.
- List filters: `search`.
- Record fields: `firstName`, `lastName`, `email`, `phone`, `company`, `address` (all but `firstName` are string or null).

### Books (`/books`)

- Create body: `title` (string min 1), `author` (string min 1), `genre` (string min 1 or null, optional), `publishedYear` (integer >= 0 or null, optional). New books start with `status` `TO_READ`.
- Update body: `title`, `author`, `genre`, `publishedYear`, `status` (`TO_READ`, `READING`, `COMPLETED`); optional, at least one required.
- List filters: `search`.
- Record fields: `title`, `author`, `genre`, `publishedYear`, `status`.

### Movies (`/movies`)

- Create body: `title` (string min 1), `director` (string min 1 or null, optional), `genre` (same), `releaseYear` (integer >= 0 or null, optional). New movies start with `status` `TO_WATCH`.
- Update body: `title`, `director`, `genre`, `releaseYear`, `status` (`TO_WATCH`, `WATCHING`, `WATCHED`); optional, at least one required.
- List filters: `search`.
- Record fields: `title`, `director`, `genre`, `releaseYear`, `status`.

### Transactions / expenses (`/transactions`, permissions prefixed `expense.`)

- Create body: `title` (string min 1), `amount` (positive number), `type` (`INCOME` or `EXPENSE`), `transactionDate` (ISO 8601 with offset), `note` (string min 1 or null, optional); all but `note` required.
- Update body: `title`, `amount`, `type`, `note`, `transactionDate`; optional, at least one required.
- List filters: `type` (`INCOME` or `EXPENSE`), `search`.
- Record fields: `title`, `amount`, `type`, `note`, `transactionDate`.

## Admin cross-user routes

For each of the six domains, administrators can list, view and delete another user's records. There is no create or update route (an administrator cannot alter a user's content). A student never gains these routes: they need the `*_any` permissions, which only the `admin` system role holds by default; a custom role holding only `read_any` can read but gets `403` on delete.

| Operation | Method and path | Permission | Success |
| --- | --- | --- | --- |
| List | `GET /admin/users/:userId/<segment>` | `<domain>.read_any` | `200`, `data` is `{ userId, items: [record] }`, `meta` is pagination; same query parameters and record shape as the own-data list |
| Read one | `GET /admin/users/:userId/<segment>/:<domain>Id` | `<domain>.read_any` | `200`, `data` is the record |
| Delete | `DELETE /admin/users/:userId/<segment>/:<domain>Id` | `<domain>.delete_any` | `204`, no body; recorded as audit action `<domain>.deleted_by_admin` |

| Domain | Segment | Id param | Delete audit action |
| --- | --- | --- | --- |
| todo | `todos` | `todoId` | `todo.deleted_by_admin` |
| note | `notes` | `noteId` | `note.deleted_by_admin` |
| contact | `contacts` | `contactId` | `contact.deleted_by_admin` |
| book | `books` | `bookId` | `book.deleted_by_admin` |
| movie | `movies` | `movieId` | `movie.deleted_by_admin` |
| expense | `transactions` | `expenseId` | `expense.deleted_by_admin` |

Errors: `400 VALIDATION_ERROR` (non-UUID ids or invalid query), `401`, `403`, `404 NOT_FOUND` ("User was not found." when the user does not exist, or the domain's not-found message when the record does not exist or belongs to another user).

Example:

```bash
curl 'http://localhost:3000/admin/users/<userId>/todos?isCompleted=false' -H 'Authorization: Bearer <token>'
curl -X DELETE http://localhost:3000/admin/users/<userId>/todos/<todoId> -H 'Authorization: Bearer <token>'
```

## Domains without an API

The database schema contains further domains that have **no API yet**: habits, products, blog posts, job applications, events, recipes, courses, travel plans, wishlist items, orders and quizzes. There are no routes for them and none should be expected.

The former public per-user data routes (a user id in the path, no token) no longer exist. Per-user data is reachable only through the authenticated routes above and, for administrators, the `/admin/users/:userId/...` routes.

## Endpoint index

Every route in the application (74 handlers: 26 fixed routes plus 6 domains x 8 routes).

| Method | Path | Auth | Permission |
| --- | --- | --- | --- |
| GET | `/health` | Public | none |
| POST | `/auth/login` | Public | none |
| POST | `/auth/refresh` | Public (cookie) | none |
| POST | `/auth/logout` | Public (cookie) | none |
| GET | `/auth/me` | Bearer | none |
| POST | `/auth/change-password` | Bearer (allowed while password change pending) | none |
| POST | `/users` | Bearer | `iam.users.create` |
| GET | `/admin/users` | Bearer | `iam.users.read` |
| GET | `/admin/users/:userId` | Bearer | `iam.users.read` |
| POST | `/admin/users` | Bearer | `iam.users.create` |
| PATCH | `/admin/users/:userId/roles` | Bearer | `iam.users.update_roles` |
| PATCH | `/admin/users/:userId/status` | Bearer | `iam.users.deactivate` |
| DELETE | `/admin/users/:userId` | Bearer | `iam.users.delete` |
| POST | `/admin/users/:userId/restore` | Bearer | `iam.users.restore` |
| POST | `/admin/users/:userId/password-reset` | Bearer | `iam.users.reset_password` |
| GET | `/admin/roles` | Bearer | `iam.roles.read` |
| POST | `/admin/roles` | Bearer | `iam.roles.create` |
| PATCH | `/admin/roles/:roleId` | Bearer | `iam.roles.update` |
| DELETE | `/admin/roles/:roleId` | Bearer | `iam.roles.delete` |
| GET | `/admin/permissions` | Bearer | `iam.permissions.read` |
| POST | `/admin/permissions` | Bearer | `iam.permissions.create` |
| PATCH | `/admin/permissions/:permissionId` | Bearer | `iam.permissions.update` |
| DELETE | `/admin/permissions/:permissionId` | Bearer | `iam.permissions.delete` |
| GET | `/admin/audit-logs` | Bearer | `iam.audit_logs.read` |
| POST | `/admin/data-resets` | Bearer | `system.reset.any` |
| POST | `/admin/demo-user-seeds` | Bearer | `system.reset.any` |
| POST | `/todos`, `/notes`, `/contacts`, `/books`, `/movies`, `/transactions` | Bearer | `<domain>.create_own` |
| GET | `/todos`, `/notes`, `/contacts`, `/books`, `/movies`, `/transactions` | Bearer | `<domain>.read_own` |
| GET | `/<base>/:<domain>Id` for the six bases | Bearer | `<domain>.read_own` |
| PATCH | `/<base>/:<domain>Id` for the six bases | Bearer | `<domain>.update_own` |
| DELETE | `/<base>/:<domain>Id` for the six bases | Bearer | `<domain>.delete_own` |
| GET | `/admin/users/:userId/<segment>` for the six segments | Bearer | `<domain>.read_any` |
| GET | `/admin/users/:userId/<segment>/:<domain>Id` | Bearer | `<domain>.read_any` |
| DELETE | `/admin/users/:userId/<segment>/:<domain>Id` | Bearer | `<domain>.delete_any` |
