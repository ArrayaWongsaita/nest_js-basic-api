export class CreateBookCommand {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly author: string,
    public readonly genre: string | null,
    public readonly publishedYear: number | null,
  ) {}
}
