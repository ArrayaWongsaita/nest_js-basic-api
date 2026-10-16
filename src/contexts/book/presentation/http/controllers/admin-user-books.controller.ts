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
  BOOK_DELETE_ANY_PERMISSION,
  BOOK_READ_ANY_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import type { AuditedAdminDeleteUserBook } from '../../../application/audit/book-audit-descriptors';
import { DeleteBookCommand } from '../../../application/commands/delete-book.command';
import { CreateBookResult } from '../../../application/dto/create-book.result';
import { ListUserBooksResult } from '../../../application/dto/list-user-books.result';
import { GetBookQuery } from '../../../application/queries/get-book.query';
import { ListUserBooksQuery } from '../../../application/queries/list-user-books.query';
import {
  ADMIN_DELETE_USER_BOOK_USE_CASE,
  ADMIN_GET_USER_BOOK_USE_CASE,
  ADMIN_LIST_USER_BOOKS_USE_CASE,
} from '../../../application/tokens';
import { ApiBookListQueryDocs } from '../decorators/api-book-list-query-docs.decorator';
import {
  AdminBookOwnerRouteParamsDto,
  AdminUserBookRouteParamsDto,
} from '../dto/admin-user-book-route-params.dto';
import { ListBooksQueryDto } from '../dto/list-books-query.dto';
import {
  ListUserBooksHttpResponseDto,
  ListUserBooksResponseDto,
} from '../dto/list-user-books-response.dto';
import { BookHttpResponseDto, BookResponseDto } from '../dto/book-response.dto';
import { BookPresenter } from '../presenters/book.presenter';

/**
 * Admin moderation of another user's books: list, view, delete. There is
 * deliberately no update route.
 */
@ApiTags('Admin User Books')
@ApiBearerAuth('access-token')
@Controller('admin/users/:userId/books')
export class AdminUserBooksController {
  constructor(
    @Inject(ADMIN_LIST_USER_BOOKS_USE_CASE)
    private readonly listUserBooks: UseCase<
      ListUserBooksQuery,
      Result<ListUserBooksResult, string>
    >,
    @Inject(ADMIN_GET_USER_BOOK_USE_CASE)
    private readonly getUserBook: UseCase<
      GetBookQuery,
      Result<CreateBookResult, string>
    >,
    @Inject(ADMIN_DELETE_USER_BOOK_USE_CASE)
    private readonly deleteUserBook: AuditedAdminDeleteUserBook,
  ) {}

  @Get()
  @RequirePermissions(BOOK_READ_ANY_PERMISSION)
  @ApiListEndpointDocs({
    summary: "List another user's books",
    description:
      'Returns a paginated list of books owned by the given user. Admin moderation route.',
    badRequestDescription:
      'The route or query parameters could not be processed.',
    successDescription: 'Book items owned by the given user.',
    responseType: ListUserBooksHttpResponseDto,
  })
  @ApiBookListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing book.read_any.')
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async listBooks(
    @Param() params: AdminBookOwnerRouteParamsDto,
    @Query() query: ListBooksQueryDto,
  ): Promise<
    HttpSuccessResponse<
      ListUserBooksResponseDto,
      ReturnType<typeof BookPresenter.toBookListPaginationMeta>
    >
  > {
    const result = await this.listUserBooks.execute(
      new ListUserBooksQuery(
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
      BookPresenter.toUserBookListResponse(result.value),
      BookPresenter.toBookListPaginationMeta(result.value),
    );
  }

  @Get(':bookId')
  @RequirePermissions(BOOK_READ_ANY_PERMISSION)
  @ApiReadEndpointDocs({
    summary: "Read one of another user's books",
    description:
      'Returns one book owned by the given user. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The book was returned successfully.',
    responseType: BookHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing book.read_any.')
  @ApiNotFoundErrorResponse('The requested user or book was not found.')
  async getBook(
    @Param() params: AdminUserBookRouteParamsDto,
  ): Promise<HttpSuccessResponse<BookResponseDto>> {
    const result = await this.getUserBook.execute(
      new GetBookQuery(params.userId, params.bookId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(BookPresenter.toBookResponse(result.value));
  }

  @Delete(':bookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(BOOK_DELETE_ANY_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: "Delete one of another user's books",
    description:
      'Deletes one book owned by the given user and records the deletion in the audit log. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The book was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing book.delete_any.')
  @ApiNotFoundErrorResponse('The requested user or book was not found.')
  async deleteBook(
    @Param() params: AdminUserBookRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteUserBook.execute(
      currentUser.userId,
      new DeleteBookCommand(params.userId, params.bookId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
