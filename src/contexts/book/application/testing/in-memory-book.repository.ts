import { Book } from '../../domain/aggregates/book.aggregate';
import {
  BookListFilters,
  BookRepository,
  PaginatedBooks,
} from '../../domain/repositories/book.repository';

/** In-memory BookRepository for specs and e2e tests. */
export class InMemoryBookRepository implements BookRepository {
  private readonly books = new Map<string, Book>();

  save(book: Book): Promise<void> {
    this.books.set(book.id.toString(), book);

    return Promise.resolve();
  }

  findPageByUserId(
    userId: string,
    filters: BookListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedBooks> {
    const search = filters.search?.trim().toLowerCase();
    const matching = [...this.books.values()]
      .filter((e) => e.userId === userId)
      .filter(
        (e) =>
          !search ||
          [e.title, e.author, e.genre ?? ''].some((text) =>
            text.toLowerCase().includes(search),
          ),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve({
      items: matching.slice((page - 1) * limit, page * limit),
      totalItems: matching.length,
    });
  }

  findByIdAndUserId(bookId: string, userId: string): Promise<Book | null> {
    const book = this.books.get(bookId);

    return Promise.resolve(book && book.userId === userId ? book : null);
  }

  deleteByIdAndUserId(bookId: string, userId: string): Promise<void> {
    if (this.books.get(bookId)?.userId === userId) {
      this.books.delete(bookId);
    }

    return Promise.resolve();
  }
}
