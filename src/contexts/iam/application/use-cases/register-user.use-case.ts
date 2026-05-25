import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { User } from '../../domain/aggregates/user.aggregate';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordPolicyService } from '../../domain/services/password-policy.service';
import { STUDENT_ROLE_NAME } from '../../domain/constants/role-name.constants';
import { RoleName } from '../../domain/value-objects/role-name';
import { UserEmailAddress } from '../../domain/value-objects/user-email-address';
import { RegisterUserCommand } from '../commands/register-user.command';
import { RegisterUserResult } from '../dto/register-user.result';
import { PasswordHasher } from '../ports/password-hasher.port';

export class RegisterUserUseCase implements UseCase<
  RegisterUserCommand,
  Result<RegisterUserResult, string>
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordPolicy: PasswordPolicyService,
  ) {}

  async execute(
    command: RegisterUserCommand,
  ): Promise<Result<RegisterUserResult, string>> {
    const email = UserEmailAddress.create(command.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      return Result.failure('User already exists.');
    }

    this.passwordPolicy.ensureSatisfied(command.password);

    const passwordHash = await this.passwordHasher.hash(command.password);
    const requestedRoles =
      command.roles.length > 0 ? command.roles : [STUDENT_ROLE_NAME];
    const user = User.register({
      email,
      passwordHash,
      roles: requestedRoles.map((role) => RoleName.create(role)),
    });

    await this.userRepository.save(user);

    return Result.success({
      userId: user.id.toString(),
      email: user.email.toString(),
      roles: user.roleNames.map((roleName) => roleName.toString()),
    });
  }
}
