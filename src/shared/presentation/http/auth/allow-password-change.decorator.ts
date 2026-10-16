import { SetMetadata } from '@nestjs/common';

export const ALLOW_PASSWORD_CHANGE_KEY = 'allow-password-change';

/**
 * Marks a route as usable by a session that is restricted to changing the
 * password (the user signed in with a temporary password).
 */
export const AllowPasswordChange = () =>
  SetMetadata(ALLOW_PASSWORD_CHANGE_KEY, true);
