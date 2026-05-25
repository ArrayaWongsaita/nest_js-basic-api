export const ADMIN_ROLE_NAME = 'admin';
export const STUDENT_ROLE_NAME = 'student';

export const DEFAULT_ROLE_NAMES = [
  ADMIN_ROLE_NAME,
  STUDENT_ROLE_NAME,
] as const;

export type DefaultRoleName = (typeof DEFAULT_ROLE_NAMES)[number];
