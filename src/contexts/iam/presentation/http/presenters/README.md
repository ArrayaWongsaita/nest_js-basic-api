# Presenters

HTTP presenters live here to translate IAM application results into transport-specific shapes.

Current presenters shape:

- authenticated session responses
- current-user responses
- user-creation responses

Presenters should stay focused on response payload mapping only.
Swagger descriptions, examples, cookies, headers, and endpoint documentation belong in DTOs, shared HTTP helpers, and controller decorators instead.
