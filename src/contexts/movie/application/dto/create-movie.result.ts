export type MovieStatusValue = 'TO_WATCH' | 'WATCHING' | 'WATCHED';

export interface CreateMovieResult {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly director: string | null;
  readonly genre: string | null;
  readonly releaseYear: number | null;
  readonly status: MovieStatusValue;
  readonly createdAt: string;
  readonly updatedAt: string;
}
