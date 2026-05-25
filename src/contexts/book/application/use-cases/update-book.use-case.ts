import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { BookRepository } from '../../domain/repositories/book.repository';
import { CreateBookResult } from '../dto/create-book.result';
import { UpdateBookCommand } from '../commands/update-book.command';
import { mapBookToResult } from './create-book.use-case';

export class UpdateBookUseCase
  implements UseCase<UpdateBookCommand, Result<CreateBookResult, string>>
{
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(
    command: UpdateBookCommand,
  ): Promise<Result<CreateBookResult, string>> {
    const book = await this.bookRepository.findByIdAndUserId(
      command.bookId,
      command.userId,
    );

    if (!book) {
      return Result.failure('Book was not found.');
    }

    book.update({
      title: command.title,
      author: command.author,
      genre: command.genre,
      publishedYear: command.publishedYear,
      status: command.status,
    });

    await this.bookRepository.save(book);

    return Result.success(mapBookToResult(book));
  }
}
