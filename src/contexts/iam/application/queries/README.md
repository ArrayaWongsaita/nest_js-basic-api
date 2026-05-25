# Queries

IAM read-side request models live here.

Current query usage:

- `GetCurrentUserQuery` loads the authenticated IAM user for `GET /auth/me`.

Conventions:

- Keep query objects small and intention-revealing.
- Use queries to express read intent at the application boundary without leaking HTTP or Prisma details.
