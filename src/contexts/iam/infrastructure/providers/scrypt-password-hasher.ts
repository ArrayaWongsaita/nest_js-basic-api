import { randomBytes, scryptSync } from 'node:crypto';
import { PasswordHasher } from '../../application/ports/password-hasher.port';

export class ScryptPasswordHasher implements PasswordHasher {
  hash(rawPassword: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(rawPassword, salt, 64).toString('hex');

    return Promise.resolve(`${salt}:${hash}`);
  }

  verify(rawPassword: string, hashedPassword: string): Promise<boolean> {
    const separatorIndex = hashedPassword.indexOf(':');

    if (separatorIndex <= 0) {
      return Promise.resolve(false);
    }

    const salt = hashedPassword.slice(0, separatorIndex);
    const expectedHash = hashedPassword.slice(separatorIndex + 1);
    const computedHash = scryptSync(rawPassword, salt, 64).toString('hex');

    return Promise.resolve(computedHash === expectedHash);
  }
}
