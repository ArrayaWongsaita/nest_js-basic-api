import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import {
  CREATE_BOOK_USE_CASE,
  DELETE_BOOK_USE_CASE,
  GET_BOOK_USE_CASE,
  LIST_USER_BOOKS_USE_CASE,
  BOOK_REPOSITORY,
  UPDATE_BOOK_USE_CASE,
} from './application/tokens';
import { CreateBookUseCase } from './application/use-cases/create-book.use-case';
import { DeleteBookUseCase } from './application/use-cases/delete-book.use-case';
import { GetBookUseCase } from './application/use-cases/get-book.use-case';
import { ListUserBooksUseCase } from './application/use-cases/list-user-books.use-case';
import { UpdateBookUseCase } from './application/use-cases/update-book.use-case';
import { PrismaBookRepository } from './infrastructure/persistence/prisma/prisma-book.repository';
import { AuthenticatedBooksController } from './presentation/http/controllers/authenticated-books.controller';
import { UserBooksController } from './presentation/http/controllers/user-books.controller';

@Module({
  imports: [DbModule],
  controllers: [AuthenticatedBooksController, UserBooksController],
  providers: [
    {
      provide: BOOK_REPOSITORY,
      useClass: PrismaBookRepository,
    },
    {
      provide: CREATE_BOOK_USE_CASE,
      useFactory: (bookRepository: PrismaBookRepository) =>
        new CreateBookUseCase(bookRepository),
      inject: [BOOK_REPOSITORY],
    },
    {
      provide: LIST_USER_BOOKS_USE_CASE,
      useFactory: (bookRepository: PrismaBookRepository) =>
        new ListUserBooksUseCase(bookRepository),
      inject: [BOOK_REPOSITORY],
    },
    {
      provide: GET_BOOK_USE_CASE,
      useFactory: (bookRepository: PrismaBookRepository) =>
        new GetBookUseCase(bookRepository),
      inject: [BOOK_REPOSITORY],
    },
    {
      provide: UPDATE_BOOK_USE_CASE,
      useFactory: (bookRepository: PrismaBookRepository) =>
        new UpdateBookUseCase(bookRepository),
      inject: [BOOK_REPOSITORY],
    },
    {
      provide: DELETE_BOOK_USE_CASE,
      useFactory: (bookRepository: PrismaBookRepository) =>
        new DeleteBookUseCase(bookRepository),
      inject: [BOOK_REPOSITORY],
    },
  ],
})
export class BookModule {}
