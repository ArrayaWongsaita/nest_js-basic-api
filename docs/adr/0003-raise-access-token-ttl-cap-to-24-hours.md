# Raise the access token lifetime cap to 24 hours

Status: accepted

`JWT_ACCESS_TTL` keeps the stateless signed-token model of [ADR-0001](./0001-stateless-short-lived-access-tokens.md), but its upper bound moves from 15 minutes to 24 hours. The cap is applied to the parsed value in seconds, so `24h`, `1d` and `1440m` all sit exactly on the boundary while `25h` and `2d` are rejected. Because the auth guard never reads the database, revocation latency equals the remaining lifetime of an already-issued access token; 24 hours is therefore the longest window this project is willing to leave a deactivated, demoted or password-reset user active. The default stays `10m`: the cap is a ceiling, not a recommendation.

## Considered Options

- **Keep the 15-minute cap.** Best revocation latency, but long sessions had to be modelled entirely through refresh calls, which some clients cannot make. Rejected.
- **Remove the cap or make it configurable through a second env var.** Flexible, but removes the only guard against a week-long token and moves a security bound into deployment config. Rejected.
- **Cap per environment (15 minutes in production, 24 hours elsewhere).** Keeps production safest, but makes the same env value mean different things in different environments. Rejected.

## Consequences

- Deactivation, role change, soft delete and password reset leave the target's current access token usable for up to the configured lifetime, at worst 24 hours. Teams that need the old guarantee must keep `JWT_ACCESS_TTL` short.
- `JWT_ACCESS_TTL` may no longer exceed `AUTH_REFRESH_TTL`; the app refuses to boot on that combination, so an access token can never outlive the session that produced it.
- In production the app logs a warning at startup when the lifetime is longer than the recommended 15 minutes.
