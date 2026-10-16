import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ListUserExpensesResult } from '../dto/list-user-expenses.result';
import { ListUserExpensesQuery } from '../queries/list-user-expenses.query';

/** Adapts the plain list use case to the Result shape `ForExistingUser` expects. */
export class ListUserExpensesAsResultUseCase implements UseCase<
  ListUserExpensesQuery,
  Result<ListUserExpensesResult, string>
> {
  constructor(
    private readonly inner: UseCase<
      ListUserExpensesQuery,
      ListUserExpensesResult
    >,
  ) {}

  async execute(
    query: ListUserExpensesQuery,
  ): Promise<Result<ListUserExpensesResult, string>> {
    return Result.success(await this.inner.execute(query));
  }
}
