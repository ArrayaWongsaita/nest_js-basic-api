export class DeleteMovieCommand {
  constructor(
    public readonly userId: string,
    public readonly movieId: string,
  ) {}
}
