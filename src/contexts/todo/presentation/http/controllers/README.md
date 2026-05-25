# Controllers

Todo HTTP controllers live here.

Current Todo HTTP API:

- `POST /todos`
- `GET /todos`
- `GET /todos/:todoId`
- `PATCH /todos/:todoId`
- `DELETE /todos/:todoId`
- `POST /users/:userId/todos`
- `GET /users/:userId/todos`
- `GET /users/:userId/todos/:todoId`
- `PATCH /users/:userId/todos/:todoId`
- `DELETE /users/:userId/todos/:todoId`

Access modes:

- `Todo (Authenticated)` uses Bearer auth and derives the owner from the access token.
- `Todo (By User ID)` is public and derives the owner directly from the `userId` route parameter.

List route conventions:

- `GET /todos` and `GET /users/:userId/todos` share the same query contract.
- Supported query params are `isCompleted`, `search`, `page`, and `limit`.
- List responses return a success envelope with `{ success, data, meta }`.
- The nested `data` object contains `{ userId, items }`, and the top-level `meta` object contains pagination fields.

Controller conventions:

- Keep controllers thin.
- Delegate behavior to application use cases.
- Use shared Swagger endpoint decorators for operation-level docs.
- Use the shared Todo list query docs helper so both list routes expose the same Swagger query contract.
