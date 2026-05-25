import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { BookRepository } from '../../domain/repositories/book.repository';
import { CreateBookResult } from '../dto/create-book.result';
import { GetBookQuery } from '../queries/get-book.query';
import { mapBookToResult } from './create-book.use-case';

export class GetBookUseCase
  implements UseCase<GetBookQuery, Result<CreateBookResult, string>>
{
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(
    query: GetBookQuery,
  ): Promise<Result<CreateBookResult, string>> {
    const book = await this.bookRepository.findByIdAndUserId(
      query.bookId,
      query.userId,
    );

    if (!book) {
      return Result.failure('Book was not found.');
    }

    return Result.success(mapBookToResult(book));
  }
}
