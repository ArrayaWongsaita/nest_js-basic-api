import { Result } from './result';
import { UseCase } from './use-case';
import { UserExistencePort } from './user-existence.port';

export const USER_NOT_FOUND_MESSAGE = 'User was not found.';

/**
 * Decorator for admin cross-user use cases: runs `inner` only when the target
 * user (`request.userId`) exists, otherwise fails with "User was not found."
 * so the caller can tell a missing user from a missing item.
 */
export class ForExistingUser<
  TRequest extends { readonly userId: string },
  TValue,
> implements UseCase<TRequest, Result<TValue, string>> {
  constructor(
    private readonly inner: UseCase<TRequest, Result<TValue, string>>,
    private readonly users: UserExistencePort,
  ) {}

  async execute(request: TRequest): Promise<Result<TValue, string>> {
    if (!(await this.users.exists(request.userId))) {
      return Result.failure(USER_NOT_FOUND_MESSAGE);
    }

    return this.inner.execute(request);
  }
}
