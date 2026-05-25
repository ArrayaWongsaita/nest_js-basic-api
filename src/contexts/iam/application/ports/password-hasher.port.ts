export interface PasswordHasher {
  hash(rawPassword: string): Promise<string>;
  verify(rawPassword: string, hashedPassword: string): Promise<boolean>;
}
