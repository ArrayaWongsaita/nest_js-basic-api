# Stateless short-lived access tokens instead of per-request status checks

Status: accepted

The 15-minute lifetime cap described below is superseded by [ADR-0003](./0003-raise-access-token-ttl-cap-to-24-hours.md); the stateless-token decision itself still stands.

The auth guard trusts a signed access token without consulting the database, and the token lifetime is short (default 10 minutes, configurable, capped at 15). When a user is deactivated, soft-deleted, has roles changed or has their password reset, the refresh token is revoked immediately, so the change takes full effect once the current access token expires.

## Considered Options

- **Check user status and roles in the database on every request.** Gives instant revocation, but adds a database read to every authenticated call and couples every route to the user store. Rejected.
- **Token denylist or version counter checked per request.** Same per-request lookup cost, plus extra state to keep consistent. Rejected.
- **Long-lived stateless tokens.** Cheapest, but leaves a deactivated or demoted user active for too long. Rejected.

## Consequences

- Revocation latency is bounded by the access token lifetime; after deactivating a user, expect up to that long before their last token stops working.
- Raising the lifetime widens that window, so it should only be lowered, or raised after deliberate review.
- Role and permission changes reach an existing token only when it is next refreshed.
