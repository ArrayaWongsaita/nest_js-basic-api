import { CreateMovieResult } from './create-movie.result';

export interface MovieListPaginationResult {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ListUserMoviesResult {
  readonly userId: string;
  readonly items: CreateMovieResult[];
  readonly meta: MovieListPaginationResult;
}
