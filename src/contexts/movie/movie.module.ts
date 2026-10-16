import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import { ForExistingUser } from '../../shared/application/for-existing-user';
import { USER_EXISTENCE } from '../../shared/application/tokens';
import type { UserExistencePort } from '../../shared/application/user-existence.port';
import { AuditedAction } from '../iam/application/audit/audited-action';
import type { AuditLogPort } from '../iam/application/ports/audit-log.port';
import { AUDIT_LOG } from '../iam/application/tokens';
import { IamModule } from '../iam/iam.module';
import { describeAdminMovieDeletion } from './application/audit/movie-audit-descriptors';
import { ListUserMoviesAsResultUseCase } from './application/use-cases/list-user-movies-as-result.use-case';
import { AdminUserMoviesController } from './presentation/http/controllers/admin-user-movies.controller';
import {
  ADMIN_DELETE_USER_MOVIE_USE_CASE,
  ADMIN_GET_USER_MOVIE_USE_CASE,
  ADMIN_LIST_USER_MOVIES_USE_CASE,
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

@Module({
  imports: [DbModule, IamModule],
  controllers: [AuthenticatedMoviesController, AdminUserMoviesController],
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
    {
      provide: ADMIN_LIST_USER_MOVIES_USE_CASE,
      useFactory: (
        movieRepository: PrismaMovieRepository,
        users: UserExistencePort,
      ) =>
        new ForExistingUser(
          new ListUserMoviesAsResultUseCase(
            new ListUserMoviesUseCase(movieRepository),
          ),
          users,
        ),
      inject: [MOVIE_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_GET_USER_MOVIE_USE_CASE,
      useFactory: (
        movieRepository: PrismaMovieRepository,
        users: UserExistencePort,
      ) => new ForExistingUser(new GetMovieUseCase(movieRepository), users),
      inject: [MOVIE_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_DELETE_USER_MOVIE_USE_CASE,
      useFactory: (
        movieRepository: PrismaMovieRepository,
        users: UserExistencePort,
        auditLog: AuditLogPort,
      ) =>
        new AuditedAction(
          new ForExistingUser(new DeleteMovieUseCase(movieRepository), users),
          auditLog,
          describeAdminMovieDeletion,
        ),
      inject: [MOVIE_REPOSITORY, USER_EXISTENCE, AUDIT_LOG],
    },
  ],
})
export class MovieModule {}
