import { UseCase } from '../../../../shared/application/use-case';
import { BookRepository } from '../../domain/repositories/book.repository';
import { ListUserBooksResult } from '../dto/list-user-books.result';
import { ListUserBooksQuery } from '../queries/list-user-books.query';
import { mapBookToResult } from './create-book.use-case';

export class ListUserBooksUseCase
  implements UseCase<ListUserBooksQuery, ListUserBooksResult>
{
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(query: ListUserBooksQuery): Promise<ListUserBooksResult> {
    const paginatedBooks = await this.bookRepository.findPageByUserId(
      query.userId,
      {
        search: query.search,
      },
      query.page,
      query.limit,
    );

    return {
      userId: query.userId,
      items: paginatedBooks.items.map(mapBookToResult),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: paginatedBooks.totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(paginatedBooks.totalItems / query.limit),
        ),
      },
    };
  }
}
