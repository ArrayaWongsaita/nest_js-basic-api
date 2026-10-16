export interface UserCredentialsPort {
  /**
   * Replaces the stored password hash and sets whether the user must choose a
   * new password before doing anything else. Returns false when the user does
   * not exist.
   */
  setPassword(
    userId: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ): Promise<boolean>;
}
