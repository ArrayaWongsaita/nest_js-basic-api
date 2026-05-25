import { CreateBookResult } from './create-book.result';

export interface BookListPaginationResult {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ListUserBooksResult {
  readonly userId: string;
  readonly items: CreateBookResult[];
  readonly meta: BookListPaginationResult;
}
