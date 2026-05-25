import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../../shared/domain/unique-entity-id';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { Movie, MovieStatus } from '../../../domain/aggregates/movie.aggregate';
import {
  PaginatedMovies,
  MovieListFilters,
  MovieRepository,
} from '../../../domain/repositories/movie.repository';

@Injectable()
export class PrismaMovieRepository implements MovieRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(movie: Movie): Promise<void> {
    await this.prisma.movie.upsert({
      where: {
        id: movie.id.toString(),
      },
      create: {
        id: movie.id.toString(),
        userId: movie.userId,
        title: movie.title,
        director: movie.director,
        genre: movie.genre,
        releaseYear: movie.releaseYear,
        status: movie.status,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
      },
      update: {
        title: movie.title,
        director: movie.director,
        genre: movie.genre,
        releaseYear: movie.releaseYear,
        status: movie.status,
        updatedAt: movie.updatedAt,
      },
    });
  }

  async findPageByUserId(
    userId: string,
    filters: MovieListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedMovies> {
    const where = createMovieWhereClause(userId, filters);
    const skip = (page - 1) * limit;

    const [movieRecords, totalItems] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.movie.count({
        where,
      }),
    ]);

    return {
      items: movieRecords.map(mapMovieRecordToAggregate),
      totalItems,
    };
  }

  async findByIdAndUserId(movieId: string, userId: string): Promise<Movie | null> {
    const movieRecord = await this.prisma.movie.findFirst({
      where: {
        id: movieId,
        userId,
      },
    });

    return movieRecord ? mapMovieRecordToAggregate(movieRecord) : null;
  }

  async deleteByIdAndUserId(movieId: string, userId: string): Promise<void> {
    await this.prisma.movie.deleteMany({
      where: {
        id: movieId,
        userId,
      },
    });
  }
}

function createMovieWhereClause(userId: string, filters: MovieListFilters) {
  const trimmedSearch = filters.search?.trim();

  return {
    userId,
    ...(trimmedSearch
      ? {
          OR: [
            {
              title: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              director: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              genre: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
}

function mapMovieRecordToAggregate(movieRecord: {
  id: string;
  userId: string;
  title: string;
  director: string | null;
  genre: string | null;
  releaseYear: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Movie {
  return Movie.rehydrate(
    {
      userId: movieRecord.userId,
      title: movieRecord.title,
      director: movieRecord.director,
      genre: movieRecord.genre,
      releaseYear: movieRecord.releaseYear,
      status: movieRecord.status as MovieStatus,
      createdAt: movieRecord.createdAt,
      updatedAt: movieRecord.updatedAt,
    },
    new UniqueEntityId(movieRecord.id),
  );
}
