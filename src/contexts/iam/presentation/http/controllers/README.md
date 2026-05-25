# Controllers

IAM HTTP controllers live here.

Current IAM HTTP API:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /users`
- `POST /admin/demo-user-seeds`

Conventions:

- Keep controllers thin.
- Delegate behavior to application use cases.
- Treat `POST /users` as admin-only onboarding, not self-registration.
- Read the authenticated principal through shared auth decorators instead of parsing headers manually inside business logic.
- Use shared composite Swagger decorators to avoid repeating operation docs metadata in every method.
- Keep demo-user seeding in the admin maintenance surface rather than embedding seed logic in public user workflows.
