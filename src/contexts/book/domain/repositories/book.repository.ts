import { Book } from '../aggregates/book.aggregate';

export interface BookListFilters {
  readonly search?: string;
}

export interface PaginatedBooks {
  readonly items: Book[];
  readonly totalItems: number;
}

export interface BookRepository {
  save(book: Book): Promise<void>;
  findPageByUserId(
    userId: string,
    filters: BookListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedBooks>;
  findByIdAndUserId(bookId: string, userId: string): Promise<Book | null>;
  deleteByIdAndUserId(bookId: string, userId: string): Promise<void>;
}
