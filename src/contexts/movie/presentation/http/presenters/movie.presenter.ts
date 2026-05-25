import { CreateMovieResult } from '../../../application/dto/create-movie.result';
import { ListUserMoviesResult } from '../../../application/dto/list-user-movies.result';
import { MovieListPaginationMetaDto } from '../dto/movie-list-pagination-meta.dto';
import { ListUserMoviesResponseDto } from '../dto/list-user-movies-response.dto';
import { MovieResponseDto } from '../dto/movie-response.dto';

export class MoviePresenter {
  static toMovieResponse(result: CreateMovieResult): MovieResponseDto {
    return {
      id: result.id,
      userId: result.userId,
      title: result.title,
      director: result.director,
      genre: result.genre,
      releaseYear: result.releaseYear,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static toUserMovieListResponse(
    result: ListUserMoviesResult,
  ): ListUserMoviesResponseDto {
    return {
      userId: result.userId,
      items: result.items.map((item) => this.toMovieResponse(item)),
    };
  }

  static toMovieListPaginationMeta(
    result: ListUserMoviesResult,
  ): MovieListPaginationMetaDto {
    return {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.totalItems,
      totalPages: result.meta.totalPages,
    };
  }
}
