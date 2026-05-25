import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { MovieRepository } from '../../domain/repositories/movie.repository';
import { DeleteMovieCommand } from '../commands/delete-movie.command';

export class DeleteMovieUseCase
  implements UseCase<DeleteMovieCommand, Result<void, string>>
{
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(command: DeleteMovieCommand): Promise<Result<void, string>> {
    const movie = await this.movieRepository.findByIdAndUserId(
      command.movieId,
      command.userId,
    );

    if (!movie) {
      return Result.failure('Movie was not found.');
    }

    await this.movieRepository.deleteByIdAndUserId(command.movieId, command.userId);

    return Result.success(undefined);
  }
}
