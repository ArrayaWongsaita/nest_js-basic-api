export class DeleteBookCommand {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {}
}
