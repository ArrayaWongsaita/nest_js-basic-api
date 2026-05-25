import { UseCase } from '../../../../shared/application/use-case';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { ListUserContactsResult } from '../dto/list-user-contacts.result';
import { ListUserContactsQuery } from '../queries/list-user-contacts.query';
import { mapContactToResult } from './create-contact.use-case';

export class ListUserContactsUseCase
  implements UseCase<ListUserContactsQuery, ListUserContactsResult>
{
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(
    query: ListUserContactsQuery,
  ): Promise<ListUserContactsResult> {
    const paginatedContacts = await this.contactRepository.findPageByUserId(
      query.userId,
      {
        search: query.search,
      },
      query.page,
      query.limit,
    );

    return {
      userId: query.userId,
      items: paginatedContacts.items.map(mapContactToResult),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: paginatedContacts.totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(paginatedContacts.totalItems / query.limit),
        ),
      },
    };
  }
}
