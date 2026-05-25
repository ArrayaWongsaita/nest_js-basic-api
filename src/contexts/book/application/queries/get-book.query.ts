export class GetBookQuery {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
  ) {}
}
