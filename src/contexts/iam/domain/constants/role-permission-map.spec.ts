import {
  BOOK_CREATE_OWN_PERMISSION,
  BOOK_DELETE_OWN_PERMISSION,
  BOOK_READ_OWN_PERMISSION,
  BOOK_UPDATE_OWN_PERMISSION,
  DEFAULT_PERMISSION_NAMES,
  IAM_AUDIT_LOGS_READ_PERMISSION,
  IAM_USERS_RESET_PASSWORD_PERMISSION,
  IAM_USERS_DELETE_PERMISSION,
  IAM_USERS_RESTORE_PERMISSION,
  EXPENSE_CREATE_OWN_PERMISSION,
  EXPENSE_DELETE_OWN_PERMISSION,
  EXPENSE_READ_OWN_PERMISSION,
  EXPENSE_UPDATE_OWN_PERMISSION,
  MOVIE_CREATE_OWN_PERMISSION,
  MOVIE_DELETE_OWN_PERMISSION,
  MOVIE_READ_OWN_PERMISSION,
  MOVIE_UPDATE_OWN_PERMISSION,
  CONTACT_CREATE_OWN_PERMISSION,
  CONTACT_DELETE_OWN_PERMISSION,
  CONTACT_READ_OWN_PERMISSION,
  CONTACT_UPDATE_OWN_PERMISSION,
  NOTE_CREATE_OWN_PERMISSION,
  NOTE_DELETE_OWN_PERMISSION,
  NOTE_READ_OWN_PERMISSION,
  NOTE_UPDATE_OWN_PERMISSION,
  TODO_CREATE_OWN_PERMISSION,
  TODO_DELETE_OWN_PERMISSION,
  TODO_READ_OWN_PERMISSION,
  TODO_UPDATE_OWN_PERMISSION,
} from './permission-name.constants';
import { DEFAULT_ROLE_PERMISSION_MAP } from './role-permission-map';
import { ADMIN_ROLE_NAME, STUDENT_ROLE_NAME } from './role-name.constants';

describe('DEFAULT_ROLE_PERMISSION_MAP', () => {
  it('grants full own-resource CRUD for student users', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).toEqual([
      TODO_CREATE_OWN_PERMISSION,
      TODO_READ_OWN_PERMISSION,
      TODO_UPDATE_OWN_PERMISSION,
      TODO_DELETE_OWN_PERMISSION,
      NOTE_CREATE_OWN_PERMISSION,
      NOTE_READ_OWN_PERMISSION,
      NOTE_UPDATE_OWN_PERMISSION,
      NOTE_DELETE_OWN_PERMISSION,
      CONTACT_CREATE_OWN_PERMISSION,
      CONTACT_READ_OWN_PERMISSION,
      CONTACT_UPDATE_OWN_PERMISSION,
      CONTACT_DELETE_OWN_PERMISSION,
      BOOK_CREATE_OWN_PERMISSION,
      BOOK_READ_OWN_PERMISSION,
      BOOK_UPDATE_OWN_PERMISSION,
      BOOK_DELETE_OWN_PERMISSION,
      MOVIE_CREATE_OWN_PERMISSION,
      MOVIE_READ_OWN_PERMISSION,
      MOVIE_UPDATE_OWN_PERMISSION,
      MOVIE_DELETE_OWN_PERMISSION,
      EXPENSE_CREATE_OWN_PERMISSION,
      EXPENSE_READ_OWN_PERMISSION,
      EXPENSE_UPDATE_OWN_PERMISSION,
      EXPENSE_DELETE_OWN_PERMISSION,
    ]);
  });

  it('keeps admin access inclusive of student CRUD permissions', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toEqual(
      expect.arrayContaining(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]),
    );
  });

  it('grants the admin role every defined permission', () => {
    expect([...DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]].sort()).toEqual(
      [...DEFAULT_PERMISSION_NAMES].sort(),
    );
  });

  it('grants cross-user todo access to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toEqual(
      expect.arrayContaining(['todo.read_any', 'todo.delete_any']),
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'todo.read_any',
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'todo.delete_any',
    );
  });

  it('grants cross-user note access to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toEqual(
      expect.arrayContaining(['note.read_any', 'note.delete_any']),
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'note.read_any',
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'note.delete_any',
    );
  });

  it('grants cross-user contact access to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toEqual(
      expect.arrayContaining(['contact.read_any', 'contact.delete_any']),
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'contact.read_any',
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'contact.delete_any',
    );
  });

  it('grants cross-user book access to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toEqual(
      expect.arrayContaining(['book.read_any', 'book.delete_any']),
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'book.read_any',
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'book.delete_any',
    );
  });

  it('grants cross-user movie access to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toEqual(
      expect.arrayContaining(['movie.read_any', 'movie.delete_any']),
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'movie.read_any',
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'movie.delete_any',
    );
  });

  it('grants cross-user expense access to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toEqual(
      expect.arrayContaining(['expense.read_any', 'expense.delete_any']),
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'expense.read_any',
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      'expense.delete_any',
    );
  });

  it('grants audit-log read to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toContain(
      IAM_AUDIT_LOGS_READ_PERMISSION,
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      IAM_AUDIT_LOGS_READ_PERMISSION,
    );
  });

  it('grants password reset to admin only', () => {
    expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toContain(
      IAM_USERS_RESET_PASSWORD_PERMISSION,
    );
    expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
      IAM_USERS_RESET_PASSWORD_PERMISSION,
    );
  });

  it('grants user delete and restore to admin only', () => {
    for (const permission of [
      IAM_USERS_DELETE_PERMISSION,
      IAM_USERS_RESTORE_PERMISSION,
    ]) {
      expect(DEFAULT_ROLE_PERMISSION_MAP[ADMIN_ROLE_NAME]).toContain(
        permission,
      );
      expect(DEFAULT_ROLE_PERMISSION_MAP[STUDENT_ROLE_NAME]).not.toContain(
        permission,
      );
    }
  });
});
