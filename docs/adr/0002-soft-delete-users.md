# Soft delete of users instead of hard delete

Status: accepted

Deleting a user sets a deletion marker rather than removing the row. The user is hidden from default lists, cannot sign in, and has their session revoked, but their record and owned data remain and an administrator can restore them. Permanent deletion is deliberately not offered through the API.

## Considered Options

- **Hard delete with cascading removal of the user's data.** Frees the email and removes personal data, but is irreversible, destroys the target of audit entries, and a mistaken or malicious delete cannot be undone. Rejected.
- **Hard delete of the user only, orphaning their data.** Leaves dangling references across the data domains. Rejected.
- **Deactivation only.** Already exists, but conflates "paused" with "removed"; administrators need a state that hides the user from normal management views.

## Consequences

- A soft-deleted user keeps their email, so it cannot be reused for a new registration until the user is restored.
- Lists exclude soft-deleted users by default and offer an explicit way to include them.
- Personal-data erasure requests would need a separate, future decision.
