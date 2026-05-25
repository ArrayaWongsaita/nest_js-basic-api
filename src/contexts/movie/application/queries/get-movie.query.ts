export class GetMovieQuery {
  constructor(
    public readonly userId: string,
    public readonly movieId: string,
  ) {}
}
