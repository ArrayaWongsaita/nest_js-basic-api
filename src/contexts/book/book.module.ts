import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import { ForExistingUser } from '../../shared/application/for-existing-user';
import { USER_EXISTENCE } from '../../shared/application/tokens';
import type { UserExistencePort } from '../../shared/application/user-existence.port';
import { AuditedAction } from '../iam/application/audit/audited-action';
import type { AuditLogPort } from '../iam/application/ports/audit-log.port';
import { AUDIT_LOG } from '../iam/application/tokens';
import { IamModule } from '../iam/iam.module';
import { describeAdminBookDeletion } from './application/audit/book-audit-descriptors';
import { ListUserBooksAsResultUseCase } from './application/use-cases/list-user-books-as-result.use-case';
import { AdminUserBooksController } from './presentation/http/controllers/admin-user-books.controller';
import {
  ADMIN_DELETE_USER_BOOK_USE_CASE,
  ADMIN_GET_USER_BOOK_USE_CASE,
  ADMIN_LIST_USER_BOOKS_USE_CASE,
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

@Module({
  imports: [DbModule, IamModule],
  controllers: [AuthenticatedBooksController, AdminUserBooksController],
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
    {
      provide: ADMIN_LIST_USER_BOOKS_USE_CASE,
      useFactory: (
        bookRepository: PrismaBookRepository,
        users: UserExistencePort,
      ) =>
        new ForExistingUser(
          new ListUserBooksAsResultUseCase(
            new ListUserBooksUseCase(bookRepository),
          ),
          users,
        ),
      inject: [BOOK_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_GET_USER_BOOK_USE_CASE,
      useFactory: (
        bookRepository: PrismaBookRepository,
        users: UserExistencePort,
      ) => new ForExistingUser(new GetBookUseCase(bookRepository), users),
      inject: [BOOK_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_DELETE_USER_BOOK_USE_CASE,
      useFactory: (
        bookRepository: PrismaBookRepository,
        users: UserExistencePort,
        auditLog: AuditLogPort,
      ) =>
        new AuditedAction(
          new ForExistingUser(new DeleteBookUseCase(bookRepository), users),
          auditLog,
          describeAdminBookDeletion,
        ),
      inject: [BOOK_REPOSITORY, USER_EXISTENCE, AUDIT_LOG],
    },
  ],
})
export class BookModule {}
