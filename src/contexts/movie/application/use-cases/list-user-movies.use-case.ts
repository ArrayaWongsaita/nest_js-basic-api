import { UseCase } from '../../../../shared/application/use-case';
import { MovieRepository } from '../../domain/repositories/movie.repository';
import { ListUserMoviesResult } from '../dto/list-user-movies.result';
import { ListUserMoviesQuery } from '../queries/list-user-movies.query';
import { mapMovieToResult } from './create-movie.use-case';

export class ListUserMoviesUseCase
  implements UseCase<ListUserMoviesQuery, ListUserMoviesResult>
{
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(query: ListUserMoviesQuery): Promise<ListUserMoviesResult> {
    const paginatedMovies = await this.movieRepository.findPageByUserId(
      query.userId,
      {
        search: query.search,
      },
      query.page,
      query.limit,
    );

    return {
      userId: query.userId,
      items: paginatedMovies.items.map(mapMovieToResult),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: paginatedMovies.totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(paginatedMovies.totalItems / query.limit),
        ),
      },
    };
  }
}
