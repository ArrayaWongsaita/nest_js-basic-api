import { UseCase } from '../../../../shared/application/use-case';
import { Book } from '../../domain/aggregates/book.aggregate';
import { BookRepository } from '../../domain/repositories/book.repository';
import { CreateBookCommand } from '../commands/create-book.command';
import { CreateBookResult } from '../dto/create-book.result';

export class CreateBookUseCase
  implements UseCase<CreateBookCommand, CreateBookResult>
{
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(command: CreateBookCommand): Promise<CreateBookResult> {
    const book = Book.create({
      userId: command.userId,
      title: command.title,
      author: command.author,
      genre: command.genre,
      publishedYear: command.publishedYear,
    });

    await this.bookRepository.save(book);

    return mapBookToResult(book);
  }
}

export function mapBookToResult(book: Book): CreateBookResult {
  return {
    id: book.id.toString(),
    userId: book.userId,
    title: book.title,
    author: book.author,
    genre: book.genre,
    publishedYear: book.publishedYear,
    status: book.status.toString(),
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  };
}
