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
import { ApiTags } from '@nestjs/swagger';
import {
  ApiNotFoundErrorResponse,
} from '../../../../../bootstrap/http/decorators/api-error-response-docs.decorator';
import {
  ApiCreateEndpointDocs,
  ApiDeleteEndpointDocs,
  ApiListEndpointDocs,
  ApiReadEndpointDocs,
  ApiUpdateEndpointDocs,
} from '../../../../../bootstrap/http/decorators/api-endpoint-docs.decorator';
import { Public } from '../../../../../shared/presentation/http/auth/public.decorator';
import {
  createSuccessResponse,
  type HttpSuccessResponse,
} from '../../../../../shared/presentation/http/response/http-response-envelope';
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
import { UpdateMovieBodyDto } from '../dto/update-movie-body.dto';
import { UserMovieOwnerParamsDto } from '../dto/user-movie-owner-params.dto';
import { UserMovieRouteParamsDto } from '../dto/user-movie-route-params.dto';
import { MoviePresenter } from '../presenters/movie.presenter';

@Public()
@ApiTags('Movie Watchlist (By User ID)')
@Controller('users/:userId/movies')
export class UserMoviesController {
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
  @ApiCreateEndpointDocs({
    summary: 'Create a movie by user ID',
    description: 'Creates a movie for the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The movie was created successfully.',
    responseType: MovieHttpResponseDto,
  })
  async createMovie(
    @Param() params: UserMovieOwnerParamsDto,
    @Body() body: CreateMovieBodyDto,
  ): Promise<HttpSuccessResponse<MovieResponseDto>> {
    const result = await this.createMovieUseCase.execute(
      new CreateMovieCommand(
        params.userId,
        body.title,
        body.director,
        body.genre,
        body.releaseYear,
      ),
    );

    return createSuccessResponse(MoviePresenter.toMovieResponse(result));
  }

  @Get()
  @ApiListEndpointDocs({
    summary: 'List movies by user ID',
    description:
      'Returns a paginated list of movies owned by the user identified directly in the route without using a Bearer token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The route parameters or query parameters failed validation.',
    successDescription: 'Movies owned by the specified user.',
    responseType: ListUserMoviesHttpResponseDto,
  })
  @ApiMovieListQueryDocs()
  async listMovies(
    @Param() params: UserMovieOwnerParamsDto,
    @Query() query: ListMoviesQueryDto,
  ): Promise<
    HttpSuccessResponse<ListUserMoviesResponseDto, ReturnType<typeof MoviePresenter.toMovieListPaginationMeta>>
  > {
    const result = await this.listUserMoviesUseCase.execute(
      new ListUserMoviesQuery(
        params.userId,
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
  @ApiReadEndpointDocs({
    summary: 'Read one movie by user ID',
    description: 'Returns one movie owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The movie was returned successfully.',
    responseType: MovieHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested movie was not found for the specified user.',
  )
  async getMovie(
    @Param() params: UserMovieRouteParamsDto,
  ): Promise<HttpSuccessResponse<MovieResponseDto>> {
    const result = await this.getMovieUseCase.execute(
      new GetMovieQuery(params.userId, params.movieId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(MoviePresenter.toMovieResponse(result.value));
  }

  @Patch(':movieId')
  @ApiUpdateEndpointDocs({
    summary: 'Update one movie by user ID',
    description: 'Partially updates one movie owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The movie was updated successfully.',
    responseType: MovieHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested movie was not found for the specified user.',
  )
  async updateMovie(
    @Param() params: UserMovieRouteParamsDto,
    @Body() body: UpdateMovieBodyDto,
  ): Promise<HttpSuccessResponse<MovieResponseDto>> {
    const result = await this.updateMovieUseCase.execute(
      new UpdateMovieCommand(
        params.userId,
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
  @ApiDeleteEndpointDocs({
    summary: 'Delete one movie by user ID',
    description: 'Deletes one movie owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The movie was deleted successfully.',
  })
  @ApiNotFoundErrorResponse(
    'The requested movie was not found for the specified user.',
  )
  async deleteMovie(@Param() params: UserMovieRouteParamsDto): Promise<void> {
    const result = await this.deleteMovieUseCase.execute(
      new DeleteMovieCommand(params.userId, params.movieId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
