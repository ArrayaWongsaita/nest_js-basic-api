import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { GetCurrentUserQuery } from '../queries/get-current-user.query';
import { UserAccessReader } from '../ports/user-access-reader.port';

export interface CurrentUserResult {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export class GetCurrentUserUseCase
  implements UseCase<GetCurrentUserQuery, Result<CurrentUserResult, string>>
{
  constructor(private readonly userAccessReader: UserAccessReader) {}

  async execute(
    query: GetCurrentUserQuery,
  ): Promise<Result<CurrentUserResult, string>> {
    const user = await this.userAccessReader.findById(query.userId);

    if (!user) {
      return Result.failure('Authenticated user was not found.');
    }

    return Result.success({
      userId: user.userId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    });
  }
}
