# DTOs

Request and response DTOs for Todo HTTP endpoints live here.

Current DTO responsibilities:

- body DTOs for create and update requests
- params DTOs for authenticated and by-user-id routes
- a shared query DTO for Todo list filters and pagination
- response DTOs for single todo responses and paginated todo list responses

List DTO conventions:

- `GET /todos` and `GET /users/:userId/todos` reuse the same Zod query DTO.
- Supported list query fields are `isCompleted`, `search`, `page`, and `limit`.
- Paginated list responses use a success envelope with `{ success, data, meta }`.
- The nested `data` object contains `{ userId, items }`.
- The top-level `meta` object contains `page`, `limit`, `totalItems`, and `totalPages`.

General conventions:

- Use `createZodDto(...)` with Zod schemas.
- Keep transport descriptions and Swagger examples at the field level with `.meta(...)`.
- Prefer DTO metadata as the primary source of OpenAPI descriptions and examples.
- Use one canonical `example` value per field so Swagger renders meaningful previews.
