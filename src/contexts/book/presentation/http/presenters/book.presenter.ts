import { CreateBookResult } from '../../../application/dto/create-book.result';
import { ListUserBooksResult } from '../../../application/dto/list-user-books.result';
import { BookListPaginationMetaDto } from '../dto/book-list-pagination-meta.dto';
import { ListUserBooksResponseDto } from '../dto/list-user-books-response.dto';
import { BookResponseDto } from '../dto/book-response.dto';

export class BookPresenter {
  static toBookResponse(result: CreateBookResult): BookResponseDto {
    return {
      id: result.id,
      userId: result.userId,
      title: result.title,
      author: result.author,
      genre: result.genre,
      publishedYear: result.publishedYear,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static toUserBookListResponse(
    result: ListUserBooksResult,
  ): ListUserBooksResponseDto {
    return {
      userId: result.userId,
      items: result.items.map((item) => this.toBookResponse(item)),
    };
  }

  static toBookListPaginationMeta(
    result: ListUserBooksResult,
  ): BookListPaginationMetaDto {
    return {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.totalItems,
      totalPages: result.meta.totalPages,
    };
  }
}
