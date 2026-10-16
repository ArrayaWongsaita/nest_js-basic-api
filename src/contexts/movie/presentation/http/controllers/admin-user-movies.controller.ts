import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import {
  ApiDeleteEndpointDocs,
  ApiListEndpointDocs,
  ApiReadEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { CurrentUser } from '../../../../../shared/presentation/http/auth/current-user.decorator';
import type { AuthenticatedUserContext } from '../../../../../shared/presentation/http/auth/authenticated-user.context';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import type { Result } from '../../../../../shared/application/result';
import type { UseCase } from '../../../../../shared/application/use-case';
import {
  MOVIE_DELETE_ANY_PERMISSION,
  MOVIE_READ_ANY_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import type { AuditedAdminDeleteUserMovie } from '../../../application/audit/movie-audit-descriptors';
import { DeleteMovieCommand } from '../../../application/commands/delete-movie.command';
import { CreateMovieResult } from '../../../application/dto/create-movie.result';
import { ListUserMoviesResult } from '../../../application/dto/list-user-movies.result';
import { GetMovieQuery } from '../../../application/queries/get-movie.query';
import { ListUserMoviesQuery } from '../../../application/queries/list-user-movies.query';
import {
  ADMIN_DELETE_USER_MOVIE_USE_CASE,
  ADMIN_GET_USER_MOVIE_USE_CASE,
  ADMIN_LIST_USER_MOVIES_USE_CASE,
} from '../../../application/tokens';
import { ApiMovieListQueryDocs } from '../decorators/api-movie-list-query-docs.decorator';
import {
  AdminMovieOwnerRouteParamsDto,
  AdminUserMovieRouteParamsDto,
} from '../dto/admin-user-movie-route-params.dto';
import { ListMoviesQueryDto } from '../dto/list-movies-query.dto';
import {
  ListUserMoviesHttpResponseDto,
  ListUserMoviesResponseDto,
} from '../dto/list-user-movies-response.dto';
import {
  MovieHttpResponseDto,
  MovieResponseDto,
} from '../dto/movie-response.dto';
import { MoviePresenter } from '../presenters/movie.presenter';

/**
 * Admin moderation of another user's movies: list, view, delete. There is
 * deliberately no update route.
 */
@ApiTags('Admin User Movies')
@ApiBearerAuth('access-token')
@Controller('admin/users/:userId/movies')
export class AdminUserMoviesController {
  constructor(
    @Inject(ADMIN_LIST_USER_MOVIES_USE_CASE)
    private readonly listUserMovies: UseCase<
      ListUserMoviesQuery,
      Result<ListUserMoviesResult, string>
    >,
    @Inject(ADMIN_GET_USER_MOVIE_USE_CASE)
    private readonly getUserMovie: UseCase<
      GetMovieQuery,
      Result<CreateMovieResult, string>
    >,
    @Inject(ADMIN_DELETE_USER_MOVIE_USE_CASE)
    private readonly deleteUserMovie: AuditedAdminDeleteUserMovie,
  ) {}

  @Get()
  @RequirePermissions(MOVIE_READ_ANY_PERMISSION)
  @ApiListEndpointDocs({
    summary: "List another user's movies",
    description:
      'Returns a paginated list of movies owned by the given user. Admin moderation route.',
    badRequestDescription:
      'The route or query parameters could not be processed.',
    successDescription: 'Movie items owned by the given user.',
    responseType: ListUserMoviesHttpResponseDto,
  })
  @ApiMovieListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing movie.read_any.')
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async listMovies(
    @Param() params: AdminMovieOwnerRouteParamsDto,
    @Query() query: ListMoviesQueryDto,
  ): Promise<
    HttpSuccessResponse<
      ListUserMoviesResponseDto,
      ReturnType<typeof MoviePresenter.toMovieListPaginationMeta>
    >
  > {
    const result = await this.listUserMovies.execute(
      new ListUserMoviesQuery(
        params.userId,
        query.search,
        query.page,
        query.limit,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      MoviePresenter.toUserMovieListResponse(result.value),
      MoviePresenter.toMovieListPaginationMeta(result.value),
    );
  }

  @Get(':movieId')
  @RequirePermissions(MOVIE_READ_ANY_PERMISSION)
  @ApiReadEndpointDocs({
    summary: "Read one of another user's movies",
    description:
      'Returns one movie owned by the given user. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The movie was returned successfully.',
    responseType: MovieHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing movie.read_any.')
  @ApiNotFoundErrorResponse('The requested user or movie was not found.')
  async getMovie(
    @Param() params: AdminUserMovieRouteParamsDto,
  ): Promise<HttpSuccessResponse<MovieResponseDto>> {
    const result = await this.getUserMovie.execute(
      new GetMovieQuery(params.userId, params.movieId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(MoviePresenter.toMovieResponse(result.value));
  }

  @Delete(':movieId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(MOVIE_DELETE_ANY_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: "Delete one of another user's movies",
    description:
      'Deletes one movie owned by the given user and records the deletion in the audit log. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The movie was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing movie.delete_any.')
  @ApiNotFoundErrorResponse('The requested user or movie was not found.')
  async deleteMovie(
    @Param() params: AdminUserMovieRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteUserMovie.execute(
      currentUser.userId,
      new DeleteMovieCommand(params.userId, params.movieId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
