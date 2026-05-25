import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../../shared/domain/unique-entity-id';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { Book, BookStatus } from '../../../domain/aggregates/book.aggregate';
import {
  PaginatedBooks,
  BookListFilters,
  BookRepository,
} from '../../../domain/repositories/book.repository';

@Injectable()
export class PrismaBookRepository implements BookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(book: Book): Promise<void> {
    await this.prisma.book.upsert({
      where: {
        id: book.id.toString(),
      },
      create: {
        id: book.id.toString(),
        userId: book.userId,
        title: book.title,
        author: book.author,
        genre: book.genre,
        publishedYear: book.publishedYear,
        status: book.status as BookStatus,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      },
      update: {
        title: book.title,
        author: book.author,
        genre: book.genre,
        publishedYear: book.publishedYear,
        status: book.status as BookStatus,
        updatedAt: book.updatedAt,
      },
    });
  }

  async findPageByUserId(
    userId: string,
    filters: BookListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedBooks> {
    const where = createBookWhereClause(userId, filters);
    const skip = (page - 1) * limit;

    const [bookRecords, totalItems] = await Promise.all([
      this.prisma.book.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.book.count({
        where,
      }),
    ]);

    return {
      items: bookRecords.map(mapBookRecordToAggregate),
      totalItems,
    };
  }

  async findByIdAndUserId(bookId: string, userId: string): Promise<Book | null> {
    const bookRecord = await this.prisma.book.findFirst({
      where: {
        id: bookId,
        userId,
      },
    });

    return bookRecord ? mapBookRecordToAggregate(bookRecord) : null;
  }

  async deleteByIdAndUserId(bookId: string, userId: string): Promise<void> {
    await this.prisma.book.deleteMany({
      where: {
        id: bookId,
        userId,
      },
    });
  }
}

function createBookWhereClause(userId: string, filters: BookListFilters) {
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
              author: {
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

function mapBookRecordToAggregate(bookRecord: {
  id: string;
  userId: string;
  title: string;
  author: string;
  genre: string | null;
  publishedYear: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Book {
  return Book.rehydrate(
    {
      userId: bookRecord.userId,
      title: bookRecord.title,
      author: bookRecord.author,
      genre: bookRecord.genre,
      publishedYear: bookRecord.publishedYear,
      status: bookRecord.status as BookStatus,
      createdAt: bookRecord.createdAt,
      updatedAt: bookRecord.updatedAt,
    },
    new UniqueEntityId(bookRecord.id),
  );
}
