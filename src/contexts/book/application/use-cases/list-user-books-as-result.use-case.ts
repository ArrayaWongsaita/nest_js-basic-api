import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ListUserBooksResult } from '../dto/list-user-books.result';
import { ListUserBooksQuery } from '../queries/list-user-books.query';

/** Adapts the plain list use case to the Result shape `ForExistingUser` expects. */
export class ListUserBooksAsResultUseCase implements UseCase<
  ListUserBooksQuery,
  Result<ListUserBooksResult, string>
> {
  constructor(
    private readonly inner: UseCase<ListUserBooksQuery, ListUserBooksResult>,
  ) {}

  async execute(
    query: ListUserBooksQuery,
  ): Promise<Result<ListUserBooksResult, string>> {
    return Result.success(await this.inner.execute(query));
  }
}
