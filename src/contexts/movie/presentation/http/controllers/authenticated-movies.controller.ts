import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiForbiddenErrorResponse,
  ApiNotFoundErrorResponse,
  ApiUnauthorizedErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import {
  ApiCreateEndpointDocs,
  ApiDeleteEndpointDocs,
  ApiListEndpointDocs,
  ApiReadEndpointDocs,
  ApiUpdateEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { CurrentUser } from '../../../../../shared/presentation/http/auth/current-user.decorator';
import type { AuthenticatedUserContext } from '../../../../../shared/presentation/http/auth/authenticated-user.context';
import { RequirePermissions } from '../../../../../shared/presentation/http/auth/require-permissions.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
import {
  MOVIE_CREATE_OWN_PERMISSION,
  MOVIE_READ_OWN_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import { CreateMovieCommand } from '../../../application/commands/create-movie.command';
import { DeleteMovieCommand } from '../../../application/commands/delete-movie.command';
import { UpdateMovieCommand } from '../../../application/commands/update-movie.command';
import { GetMovieQuery } from '../../../application/queries/get-movie.query';
import { ListUserMoviesQuery } from '../../../application/queries/list-user-movies.query';
import {
  CREATE_MOVIE_USE_CASE,
  DELETE_MOVIE_USE_CASE,
  GET_MOVIE_USE_CASE,
  LIST_USER_MOVIES_USE_CASE,
  UPDATE_MOVIE_USE_CASE,
} from '../../../application/tokens';
import { CreateMovieUseCase } from '../../../application/use-cases/create-movie.use-case';
import { DeleteMovieUseCase } from '../../../application/use-cases/delete-movie.use-case';
import { GetMovieUseCase } from '../../../application/use-cases/get-movie.use-case';
import { ListUserMoviesUseCase } from '../../../application/use-cases/list-user-movies.use-case';
import { UpdateMovieUseCase } from '../../../application/use-cases/update-movie.use-case';
import { ApiMovieListQueryDocs } from '../decorators/api-movie-list-query-docs.decorator';
import { CreateMovieBodyDto } from '../dto/create-movie-body.dto';
import {
  ListUserMoviesHttpResponseDto,
  ListUserMoviesResponseDto,
} from '../dto/list-user-movies-response.dto';
import { ListMoviesQueryDto } from '../dto/list-movies-query.dto';
import {
  MovieHttpResponseDto,
  MovieResponseDto,
} from '../dto/movie-response.dto';
import { MovieRouteParamsDto } from '../dto/movie-route-params.dto';
import { UpdateMovieBodyDto } from '../dto/update-movie-body.dto';
import { MoviePresenter } from '../presenters/movie.presenter';

@ApiTags('Movie Watchlist (Authenticated)')
@ApiBearerAuth('access-token')
@Controller('movies')
export class AuthenticatedMoviesController {
  constructor(
    @Inject(CREATE_MOVIE_USE_CASE)
    private readonly createMovieUseCase: CreateMovieUseCase,
    @Inject(LIST_USER_MOVIES_USE_CASE)
    private readonly listUserMoviesUseCase: ListUserMoviesUseCase,
    @Inject(GET_MOVIE_USE_CASE)
    private readonly getMovieUseCase: GetMovieUseCase,
    @Inject(UPDATE_MOVIE_USE_CASE)
    private readonly updateMovieUseCase: UpdateMovieUseCase,
    @Inject(DELETE_MOVIE_USE_CASE)
    private readonly deleteMovieUseCase: DeleteMovieUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(MOVIE_CREATE_OWN_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a movie for the authenticated user',
    description: 'Creates a movie for the user represented by the current Bearer access token.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The movie was created successfully.',
    responseType: MovieHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing movie.create_own.',
  )
  async createMovie(
    @Body() body: CreateMovieBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<MovieResponseDto>> {
    const result = await this.createMovieUseCase.execute(
      new CreateMovieCommand(
        currentUser.userId,
        body.title,
        body.director,
        body.genre,
        body.releaseYear,
      ),
    );

    return createSuccessResponse(MoviePresenter.toMovieResponse(result));
  }

  @Get()
  @RequirePermissions(MOVIE_READ_OWN_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List movies for the authenticated user',
    description:
      'Returns a paginated list of movies owned by the user represented by the current Bearer access token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The request query parameters could not be processed.',
    successDescription: 'Movies owned by the authenticated user.',
    responseType: ListUserMoviesHttpResponseDto,
  })
  @ApiMovieListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing movie.read_own.',
  )
  async listMovies(
    @Query() query: ListMoviesQueryDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<
    HttpSuccessResponse<ListUserMoviesResponseDto, ReturnType<typeof MoviePresenter.toMovieListPaginationMeta>>
  > {
    const result = await this.listUserMoviesUseCase.execute(
      new ListUserMoviesQuery(
        currentUser.userId,
        query.search,
        query.page,
        query.limit,
      ),
    );

    return createSuccessResponse(
      MoviePresenter.toUserMovieListResponse(result),
      MoviePresenter.toMovieListPaginationMeta(result),
    );
  }

  @Get(':movieId')
  @RequirePermissions(MOVIE_READ_OWN_PERMISSION)
  @ApiReadEndpointDocs({
    summary: 'Read one movie for the authenticated user',
    description: 'Returns one movie owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The movie was returned successfully.',
    responseType: MovieHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing movie.read_own.',
  )
  @ApiNotFoundErrorResponse('The requested movie was not found.')
  async getMovie(
    @Param() params: MovieRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<MovieResponseDto>> {
    const result = await this.getMovieUseCase.execute(
      new GetMovieQuery(currentUser.userId, params.movieId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(MoviePresenter.toMovieResponse(result.value));
  }

  @Patch(':movieId')
  @RequirePermissions(MOVIE_CREATE_OWN_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update one movie for the authenticated user',
    description: 'Partially updates one movie owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The movie was updated successfully.',
    responseType: MovieHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing movie.create_own.',
  )
  @ApiNotFoundErrorResponse('The requested movie was not found.')
  async updateMovie(
    @Param() params: MovieRouteParamsDto,
    @Body() body: UpdateMovieBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<MovieResponseDto>> {
    const result = await this.updateMovieUseCase.execute(
      new UpdateMovieCommand(
        currentUser.userId,
        params.movieId,
        body.title,
        body.director,
        body.genre,
        body.releaseYear,
        body.status,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(MoviePresenter.toMovieResponse(result.value));
  }

  @Delete(':movieId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(MOVIE_CREATE_OWN_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete one movie for the authenticated user',
    description: 'Deletes one movie owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The movie was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing movie.create_own.',
  )
  @ApiNotFoundErrorResponse('The requested movie was not found.')
  async deleteMovie(
    @Param() params: MovieRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteMovieUseCase.execute(
      new DeleteMovieCommand(currentUser.userId, params.movieId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
