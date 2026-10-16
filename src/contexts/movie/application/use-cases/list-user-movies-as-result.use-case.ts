import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ListUserMoviesResult } from '../dto/list-user-movies.result';
import { ListUserMoviesQuery } from '../queries/list-user-movies.query';

/** Adapts the plain list use case to the Result shape `ForExistingUser` expects. */
export class ListUserMoviesAsResultUseCase implements UseCase<
  ListUserMoviesQuery,
  Result<ListUserMoviesResult, string>
> {
  constructor(
    private readonly inner: UseCase<ListUserMoviesQuery, ListUserMoviesResult>,
  ) {}

  async execute(
    query: ListUserMoviesQuery,
  ): Promise<Result<ListUserMoviesResult, string>> {
    return Result.success(await this.inner.execute(query));
  }
}
