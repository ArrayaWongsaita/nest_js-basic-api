import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { BookRepository } from '../../domain/repositories/book.repository';
import { DeleteBookCommand } from '../commands/delete-book.command';

export class DeleteBookUseCase
  implements UseCase<DeleteBookCommand, Result<void, string>>
{
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(command: DeleteBookCommand): Promise<Result<void, string>> {
    const book = await this.bookRepository.findByIdAndUserId(
      command.bookId,
      command.userId,
    );

    if (!book) {
      return Result.failure('Book was not found.');
    }

    await this.bookRepository.deleteByIdAndUserId(command.bookId, command.userId);

    return Result.success(undefined);
  }
}
