import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import {
  CREATE_MOVIE_USE_CASE,
  DELETE_MOVIE_USE_CASE,
  GET_MOVIE_USE_CASE,
  LIST_USER_MOVIES_USE_CASE,
  MOVIE_REPOSITORY,
  UPDATE_MOVIE_USE_CASE,
} from './application/tokens';
import { CreateMovieUseCase } from './application/use-cases/create-movie.use-case';
import { DeleteMovieUseCase } from './application/use-cases/delete-movie.use-case';
import { GetMovieUseCase } from './application/use-cases/get-movie.use-case';
import { ListUserMoviesUseCase } from './application/use-cases/list-user-movies.use-case';
import { UpdateMovieUseCase } from './application/use-cases/update-movie.use-case';
import { PrismaMovieRepository } from './infrastructure/persistence/prisma/prisma-movie.repository';
import { AuthenticatedMoviesController } from './presentation/http/controllers/authenticated-movies.controller';
import { UserMoviesController } from './presentation/http/controllers/user-movies.controller';

@Module({
  imports: [DbModule],
  controllers: [AuthenticatedMoviesController, UserMoviesController],
  providers: [
    {
      provide: MOVIE_REPOSITORY,
      useClass: PrismaMovieRepository,
    },
    {
      provide: CREATE_MOVIE_USE_CASE,
      useFactory: (movieRepository: PrismaMovieRepository) =>
        new CreateMovieUseCase(movieRepository),
      inject: [MOVIE_REPOSITORY],
    },
    {
      provide: LIST_USER_MOVIES_USE_CASE,
      useFactory: (movieRepository: PrismaMovieRepository) =>
        new ListUserMoviesUseCase(movieRepository),
      inject: [MOVIE_REPOSITORY],
    },
    {
      provide: GET_MOVIE_USE_CASE,
      useFactory: (movieRepository: PrismaMovieRepository) =>
        new GetMovieUseCase(movieRepository),
      inject: [MOVIE_REPOSITORY],
    },
    {
      provide: UPDATE_MOVIE_USE_CASE,
      useFactory: (movieRepository: PrismaMovieRepository) =>
        new UpdateMovieUseCase(movieRepository),
      inject: [MOVIE_REPOSITORY],
    },
    {
      provide: DELETE_MOVIE_USE_CASE,
      useFactory: (movieRepository: PrismaMovieRepository) =>
        new DeleteMovieUseCase(movieRepository),
      inject: [MOVIE_REPOSITORY],
    },
  ],
})
export class MovieModule {}
