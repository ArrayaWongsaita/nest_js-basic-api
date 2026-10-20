# Admin System Management

The language used to run and secure this API: who the people are, what they are allowed to do, how their sign-in lasts, and how administrator actions are recorded.

## People and access

**User**:
A person with an account who signs in with an email and password.
_Avoid_: Account, member

**Administrator**:
A user who holds the `admin` system role and can manage other users, roles and their data.
_Avoid_: Admin user, superuser

**Student**:
A user who holds only the `student` system role and works with their own data.
_Avoid_: Regular user, customer

**System user**:
A user created by the system itself (for example the bootstrap administrator) rather than registered by a person; it is protected from deletion.
_Avoid_: Service account, built-in user

**Role**:
A named set of permissions that can be assigned to users.
_Avoid_: Group, level

**System role**:
One of the default roles (`admin`, `student`) whose permissions cannot be changed or removed through the API or by re-seeding.
_Avoid_: Built-in role, default role

**Permission**:
A named right to perform one kind of action, such as `todo.delete_own` or `iam.users.delete`.
_Avoid_: Privilege, scope

**Last active administrator**:
The only remaining non-deleted, active administrator; the system always keeps at least one.
_Avoid_: Sole admin

## Own versus any data

**Own permission** (`*.read_own`, `*.delete_own`, ...):
A permission that applies only to data the user created.
_Avoid_: Self permission

**Any permission** (`*.read_any`, `*.delete_any`):
A permission that applies to data created by any user, granted to administrators only. Reading and deleting are allowed; editing another user's data is not.
_Avoid_: Global permission, admin permission

## Sessions and credentials

**Session**:
A signed-in period of a user, made of a short-lived access token and a longer-lived refresh token.
_Avoid_: Login

**Access token**:
A short-lived proof of identity sent with each request; once issued it stays valid until it expires.
_Avoid_: JWT, bearer

**Access token lifetime**:
How long an issued access token stays valid; defaults to 10 minutes and may not exceed 24 hours.
_Avoid_: Token expiry, session timeout

**Refresh token**:
A long-lived secret that can be exchanged for a new access token; it can be revoked, which ends the session.
_Avoid_: Session token

**Session revocation**:
Removing a user's refresh token so the session cannot be renewed; happens on deactivation, deletion, role change and password reset.
_Avoid_: Kicking out, invalidation

**Revocation latency**:
The time a revoked user keeps working, which lasts until their current access token expires.
_Avoid_: Revocation delay, propagation delay

**Temporary password**:
A one-time password generated when an administrator resets a user's password and shown to the administrator once.
_Avoid_: Default password

**Must change password** (`mustChangePassword`):
A state on a user who signed in with a temporary password; their session may only be used to change the password, which clears the state.
_Avoid_: Expired password, forced reset

## Lifecycle and accountability

**Deactivated user**:
A user who is kept but cannot sign in; reversible by reactivating.
_Avoid_: Disabled, banned

**Soft-deleted user**:
A user hidden from default lists and unable to sign in, whose record and data are retained so they can be restored. There is no permanent deletion.
_Avoid_: Removed user, archived user

**Restore**:
Bringing a soft-deleted user back so they can sign in again.
_Avoid_: Undelete

**Audit entry**:
An immutable record of an administrator action: who acted, what, on which target, the outcome and when. It never holds secrets or passwords.
_Avoid_: Log line, history item

**Data reset**:
An administrator action that wipes system data; rejected in production unless explicitly enabled.
_Avoid_: Wipe, purge

**Demo seed**:
An administrator action that creates demo users with known passwords; rejected in production unless explicitly enabled.
_Avoid_: Fixtures
