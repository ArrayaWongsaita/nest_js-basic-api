import { Movie } from '../../domain/aggregates/movie.aggregate';
import {
  MovieListFilters,
  MovieRepository,
  PaginatedMovies,
} from '../../domain/repositories/movie.repository';

/** In-memory MovieRepository for specs and e2e tests. */
export class InMemoryMovieRepository implements MovieRepository {
  private readonly movies = new Map<string, Movie>();

  save(movie: Movie): Promise<void> {
    this.movies.set(movie.id.toString(), movie);

    return Promise.resolve();
  }

  findPageByUserId(
    userId: string,
    filters: MovieListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedMovies> {
    const search = filters.search?.trim().toLowerCase();
    const matching = [...this.movies.values()]
      .filter((e) => e.userId === userId)
      .filter(
        (e) =>
          !search ||
          [e.title, e.director ?? '', e.genre ?? ''].some((text) =>
            text.toLowerCase().includes(search),
          ),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve({
      items: matching.slice((page - 1) * limit, page * limit),
      totalItems: matching.length,
    });
  }

  findByIdAndUserId(movieId: string, userId: string): Promise<Movie | null> {
    const movie = this.movies.get(movieId);

    return Promise.resolve(movie && movie.userId === userId ? movie : null);
  }

  deleteByIdAndUserId(movieId: string, userId: string): Promise<void> {
    if (this.movies.get(movieId)?.userId === userId) {
      this.movies.delete(movieId);
    }

    return Promise.resolve();
  }
}
