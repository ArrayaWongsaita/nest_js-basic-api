import { UseCase } from '../../../../shared/application/use-case';
import { Movie } from '../../domain/aggregates/movie.aggregate';
import { MovieRepository } from '../../domain/repositories/movie.repository';
import { CreateMovieCommand } from '../commands/create-movie.command';
import { CreateMovieResult } from '../dto/create-movie.result';

export class CreateMovieUseCase
  implements UseCase<CreateMovieCommand, CreateMovieResult>
{
  constructor(private readonly movieRepository: MovieRepository) {}

  async execute(command: CreateMovieCommand): Promise<CreateMovieResult> {
    const movie = Movie.create({
      userId: command.userId,
      title: command.title,
      director: command.director,
      genre: command.genre,
      releaseYear: command.releaseYear,
    });

    await this.movieRepository.save(movie);

    return mapMovieToResult(movie);
  }
}

export function mapMovieToResult(movie: Movie): CreateMovieResult {
  return {
    id: movie.id.toString(),
    userId: movie.userId,
    title: movie.title,
    director: movie.director,
    genre: movie.genre,
    releaseYear: movie.releaseYear,
    status: movie.status,
    createdAt: movie.createdAt.toISOString(),
    updatedAt: movie.updatedAt.toISOString(),
  };
}
