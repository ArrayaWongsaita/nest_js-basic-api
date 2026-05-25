import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { MovieRepository } from '../../domain/repositories/movie.repository';
import { CreateMovieResult } from '../dto/create-movie.result';
import { GetMovieQuery } from '../queries/get-movie.query';
import { mapMovieToResult } from './create-movie.use-case';

export class GetMovieUseCase
  implements UseCase<GetMovieQuery, Result<CreateMovieResult, string>>
{
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(
    query: GetMovieQuery,
  ): Promise<Result<CreateMovieResult, string>> {
    const movie = await this.movieRepository.findByIdAndUserId(
      query.movieId,
      query.userId,
    );

    if (!movie) {
      return Result.failure('Movie was not found.');
    }

    return Result.success(mapMovieToResult(movie));
  }
}
