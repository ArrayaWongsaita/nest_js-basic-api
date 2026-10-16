# Controllers

Todo HTTP controllers live here.

Current Todo HTTP API:

- `POST /todos`
- `GET /todos`
- `GET /todos/:todoId`
- `PATCH /todos/:todoId`
- `DELETE /todos/:todoId`

Access modes:

- `Todo (Authenticated)` uses Bearer auth and derives the owner from the access token.

List route conventions:

- `GET /todos` uses a Zod query contract.

- Supported query params are `isCompleted`, `search`, `page`, and `limit`.
- List responses return a success envelope with `{ success, data, meta }`.
- The nested `data` object contains `{ userId, items }`, and the top-level `meta` object contains pagination fields.

Controller conventions:

- Keep controllers thin.
- Delegate behavior to application use cases.
- Use shared Swagger endpoint decorators for operation-level docs.
- Use the shared Todo list query docs helper so both list routes expose the same Swagger query contract.
