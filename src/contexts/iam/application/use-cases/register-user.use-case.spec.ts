import { Result } from '../../../../shared/application/result';
import { User } from '../../domain/aggregates/user.aggregate';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordPolicyService } from '../../domain/services/password-policy.service';
import { UserEmailAddress } from '../../domain/value-objects/user-email-address';
import { RegisterUserCommand } from '../commands/register-user.command';
import { PasswordHasher } from '../ports/password-hasher.port';
import { RegisterUserUseCase } from './register-user.use-case';

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  findByEmail(email: UserEmailAddress): Promise<User | null> {
    return Promise.resolve(this.users.get(email.toString()) ?? null);
  }

  findById(): Promise<User | null> {
    return Promise.resolve(null);
  }

  save(user: User): Promise<void> {
    this.users.set(user.email.toString(), user);

    return Promise.resolve();
  }
}

class TestPasswordHasher implements PasswordHasher {
  hash(rawPassword: string): Promise<string> {
    return Promise.resolve(`hashed:${rawPassword}`);
  }

  verify(rawPassword: string, hashedPassword: string): Promise<boolean> {
    return Promise.resolve(hashedPassword === `hashed:${rawPassword}`);
  }
}

describe('RegisterUserUseCase', () => {
  it('registers a user without requiring Nest runtime', async () => {
    const useCase = new RegisterUserUseCase(
      new InMemoryUserRepository(),
      new TestPasswordHasher(),
      new PasswordPolicyService(),
    );
    const command = new RegisterUserCommand(
      'architect@example.com',
      'strong-password',
      ['admin'],
    );

    const result = await useCase.execute(command);

    expect(result).toBeInstanceOf(Result);
    expect(result.ok).toBe(true);
    expect(result.value.email).toBe('architect@example.com');
    expect(result.value.roles).toEqual(['admin']);
  });

  it('rejects duplicate users', async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new RegisterUserUseCase(
      repository,
      new TestPasswordHasher(),
      new PasswordPolicyService(),
    );
    const command = new RegisterUserCommand(
      'architect@example.com',
      'strong-password',
      ['admin'],
    );

    await useCase.execute(command);
    const duplicateResult = await useCase.execute(command);

    expect(duplicateResult.ok).toBe(false);
    expect(duplicateResult.error).toBe('User already exists.');
  });

  it('assigns the student role when no explicit roles are supplied', async () => {
    const useCase = new RegisterUserUseCase(
      new InMemoryUserRepository(),
      new TestPasswordHasher(),
      new PasswordPolicyService(),
    );

    const result = await useCase.execute(
      new RegisterUserCommand(
        'student@example.com',
        'strong-password',
        [],
      ),
    );

    expect(result.ok).toBe(true);
    expect(result.value.roles).toEqual(['student']);
  });
});
