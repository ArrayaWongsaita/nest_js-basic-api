import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ListUserTodosResult } from '../dto/list-user-todos.result';
import { ListUserTodosQuery } from '../queries/list-user-todos.query';

/** Adapts the plain list use case to the Result shape `ForExistingUser` expects. */
export class ListUserTodosAsResultUseCase implements UseCase<
  ListUserTodosQuery,
  Result<ListUserTodosResult, string>
> {
  constructor(
    private readonly inner: UseCase<ListUserTodosQuery, ListUserTodosResult>,
  ) {}

  async execute(
    query: ListUserTodosQuery,
  ): Promise<Result<ListUserTodosResult, string>> {
    return Result.success(await this.inner.execute(query));
  }
}
