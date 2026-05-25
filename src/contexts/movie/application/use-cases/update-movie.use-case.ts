import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { MovieStatus } from '../../domain/aggregates/movie.aggregate';
import { MovieRepository } from '../../domain/repositories/movie.repository';
import { CreateMovieResult } from '../dto/create-movie.result';
import { UpdateMovieCommand } from '../commands/update-movie.command';
import { mapMovieToResult } from './create-movie.use-case';

export class UpdateMovieUseCase
  implements UseCase<UpdateMovieCommand, Result<CreateMovieResult, string>>
{
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(
    command: UpdateMovieCommand,
  ): Promise<Result<CreateMovieResult, string>> {
    const movie = await this.movieRepository.findByIdAndUserId(
      command.movieId,
      command.userId,
    );

    if (!movie) {
      return Result.failure('Movie was not found.');
    }

    movie.update({
      title: command.title,
      director: command.director,
      genre: command.genre,
      releaseYear: command.releaseYear,
      status:
        command.status !== undefined
          ? (command.status as MovieStatus)
          : undefined,
    });

    await this.movieRepository.save(movie);

    return Result.success(mapMovieToResult(movie));
  }
}
