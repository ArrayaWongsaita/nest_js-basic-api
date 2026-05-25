import { BookStatus } from '../../domain/aggregates/book.aggregate';

export class UpdateBookCommand {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly title?: string,
    public readonly author?: string,
    public readonly genre?: string | null,
    public readonly publishedYear?: number | null,
    public readonly status?: BookStatus,
  ) {}
}
