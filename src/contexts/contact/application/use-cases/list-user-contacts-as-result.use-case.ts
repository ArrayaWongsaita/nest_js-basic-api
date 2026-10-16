import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ListUserContactsResult } from '../dto/list-user-contacts.result';
import { ListUserContactsQuery } from '../queries/list-user-contacts.query';

/** Adapts the plain list use case to the Result shape `ForExistingUser` expects. */
export class ListUserContactsAsResultUseCase implements UseCase<
  ListUserContactsQuery,
  Result<ListUserContactsResult, string>
> {
  constructor(
    private readonly inner: UseCase<
      ListUserContactsQuery,
      ListUserContactsResult
    >,
  ) {}

  async execute(
    query: ListUserContactsQuery,
  ): Promise<Result<ListUserContactsResult, string>> {
    return Result.success(await this.inner.execute(query));
  }
}
