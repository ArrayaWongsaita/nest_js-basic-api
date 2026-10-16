import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ListUserNotesResult } from '../dto/list-user-notes.result';
import { ListUserNotesQuery } from '../queries/list-user-notes.query';

/** Adapts the plain list use case to the Result shape `ForExistingUser` expects. */
export class ListUserNotesAsResultUseCase implements UseCase<
  ListUserNotesQuery,
  Result<ListUserNotesResult, string>
> {
  constructor(
    private readonly inner: UseCase<ListUserNotesQuery, ListUserNotesResult>,
  ) {}

  async execute(
    query: ListUserNotesQuery,
  ): Promise<Result<ListUserNotesResult, string>> {
    return Result.success(await this.inner.execute(query));
  }
}
