export class UpdateMovieCommand {
  constructor(
    public readonly userId: string,
    public readonly movieId: string,
    public readonly title?: string,
    public readonly director?: string | null,
    public readonly genre?: string | null,
    public readonly releaseYear?: number | null,
    public readonly status?: string,
  ) {}
}
