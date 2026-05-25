export class PasswordPolicyService {
  ensureSatisfied(password: string): void {
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters long.');
    }
  }
}
