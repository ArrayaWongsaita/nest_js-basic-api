import { Movie } from '../aggregates/movie.aggregate';

export interface MovieListFilters {
  readonly search?: string;
}

export interface PaginatedMovies {
  readonly items: Movie[];
  readonly totalItems: number;
}

export interface MovieRepository {
  save(movie: Movie): Promise<void>;
  findPageByUserId(
    userId: string,
    filters: MovieListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedMovies>;
  findByIdAndUserId(movieId: string, userId: string): Promise<Movie | null>;
  deleteByIdAndUserId(movieId: string, userId: string): Promise<void>;
}
