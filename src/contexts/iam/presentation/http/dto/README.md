# DTOs

Request and response DTOs for IAM HTTP endpoints live here.

Current DTOs support:

- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /users`

Conventions:

- Use `createZodDto(...)` with Zod schemas.
- Keep transport descriptions and Swagger examples at the field level.
- Prefer DTO metadata as the primary source of OpenAPI examples.
- Use one canonical `example` value per field so Swagger UI renders meaningful object previews instead of generic placeholders.
- Keep auth transport contracts explicit: access tokens belong in JSON responses, refresh tokens belong in cookies.
