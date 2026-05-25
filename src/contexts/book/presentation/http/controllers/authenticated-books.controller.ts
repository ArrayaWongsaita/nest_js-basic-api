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
  BOOK_CREATE_OWN_PERMISSION,
  BOOK_DELETE_OWN_PERMISSION,
  BOOK_READ_OWN_PERMISSION,
  BOOK_UPDATE_OWN_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import { CreateBookCommand } from '../../../application/commands/create-book.command';
import { DeleteBookCommand } from '../../../application/commands/delete-book.command';
import { UpdateBookCommand } from '../../../application/commands/update-book.command';
import { GetBookQuery } from '../../../application/queries/get-book.query';
import { ListUserBooksQuery } from '../../../application/queries/list-user-books.query';
import {
  CREATE_BOOK_USE_CASE,
  DELETE_BOOK_USE_CASE,
  GET_BOOK_USE_CASE,
  LIST_USER_BOOKS_USE_CASE,
  UPDATE_BOOK_USE_CASE,
} from '../../../application/tokens';
import { CreateBookUseCase } from '../../../application/use-cases/create-book.use-case';
import { DeleteBookUseCase } from '../../../application/use-cases/delete-book.use-case';
import { GetBookUseCase } from '../../../application/use-cases/get-book.use-case';
import { ListUserBooksUseCase } from '../../../application/use-cases/list-user-books.use-case';
import { UpdateBookUseCase } from '../../../application/use-cases/update-book.use-case';
import { BookStatus } from '../../../domain/aggregates/book.aggregate';
import { ApiBookListQueryDocs } from '../decorators/api-book-list-query-docs.decorator';
import { CreateBookBodyDto } from '../dto/create-book-body.dto';
import {
  ListUserBooksHttpResponseDto,
  ListUserBooksResponseDto,
} from '../dto/list-user-books-response.dto';
import { ListBooksQueryDto } from '../dto/list-books-query.dto';
import {
  BookHttpResponseDto,
  BookResponseDto,
} from '../dto/book-response.dto';
import { BookRouteParamsDto } from '../dto/book-route-params.dto';
import { UpdateBookBodyDto } from '../dto/update-book-body.dto';
import { BookPresenter } from '../presenters/book.presenter';

@ApiTags('Book Library (Authenticated)')
@ApiBearerAuth('access-token')
@Controller('books')
export class AuthenticatedBooksController {
  constructor(
    @Inject(CREATE_BOOK_USE_CASE)
    private readonly createBookUseCase: CreateBookUseCase,
    @Inject(LIST_USER_BOOKS_USE_CASE)
    private readonly listUserBooksUseCase: ListUserBooksUseCase,
    @Inject(GET_BOOK_USE_CASE)
    private readonly getBookUseCase: GetBookUseCase,
    @Inject(UPDATE_BOOK_USE_CASE)
    private readonly updateBookUseCase: UpdateBookUseCase,
    @Inject(DELETE_BOOK_USE_CASE)
    private readonly deleteBookUseCase: DeleteBookUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(BOOK_CREATE_OWN_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a book for the authenticated user',
    description: 'Creates a book for the user represented by the current Bearer access token.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The book was created successfully.',
    responseType: BookHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing book.create_own.',
  )
  async createBook(
    @Body() body: CreateBookBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<BookResponseDto>> {
    const result = await this.createBookUseCase.execute(
      new CreateBookCommand(
        currentUser.userId,
        body.title,
        body.author,
        body.genre,
        body.publishedYear,
      ),
    );

    return createSuccessResponse(BookPresenter.toBookResponse(result));
  }

  @Get()
  @RequirePermissions(BOOK_READ_OWN_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List books for the authenticated user',
    description:
      'Returns a paginated list of books owned by the user represented by the current Bearer access token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The request query parameters could not be processed.',
    successDescription: 'Books owned by the authenticated user.',
    responseType: ListUserBooksHttpResponseDto,
  })
  @ApiBookListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing book.read_own.',
  )
  async listBooks(
    @Query() query: ListBooksQueryDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<
    HttpSuccessResponse<ListUserBooksResponseDto, ReturnType<typeof BookPresenter.toBookListPaginationMeta>>
  > {
    const result = await this.listUserBooksUseCase.execute(
      new ListUserBooksQuery(
        currentUser.userId,
        query.search,
        query.page,
        query.limit,
      ),
    );

    return createSuccessResponse(
      BookPresenter.toUserBookListResponse(result),
      BookPresenter.toBookListPaginationMeta(result),
    );
  }

  @Get(':bookId')
  @RequirePermissions(BOOK_READ_OWN_PERMISSION)
  @ApiReadEndpointDocs({
    summary: 'Read one book for the authenticated user',
    description: 'Returns one book owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The book was returned successfully.',
    responseType: BookHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing book.read_own.',
  )
  @ApiNotFoundErrorResponse('The requested book was not found.')
  async getBook(
    @Param() params: BookRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<BookResponseDto>> {
    const result = await this.getBookUseCase.execute(
      new GetBookQuery(currentUser.userId, params.bookId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(BookPresenter.toBookResponse(result.value));
  }

  @Patch(':bookId')
  @RequirePermissions(BOOK_UPDATE_OWN_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update one book for the authenticated user',
    description: 'Partially updates one book owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The book was updated successfully.',
    responseType: BookHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing book.update_own.',
  )
  @ApiNotFoundErrorResponse('The requested book was not found.')
  async updateBook(
    @Param() params: BookRouteParamsDto,
    @Body() body: UpdateBookBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<BookResponseDto>> {
    const result = await this.updateBookUseCase.execute(
      new UpdateBookCommand(
        currentUser.userId,
        params.bookId,
        body.title,
        body.author,
        body.genre,
        body.publishedYear,
        body.status ? (body.status as BookStatus) : undefined,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(BookPresenter.toBookResponse(result.value));
  }

  @Delete(':bookId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(BOOK_DELETE_OWN_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete one book for the authenticated user',
    description: 'Deletes one book owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The book was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing book.delete_own.',
  )
  @ApiNotFoundErrorResponse('The requested book was not found.')
  async deleteBook(
    @Param() params: BookRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteBookUseCase.execute(
      new DeleteBookCommand(currentUser.userId, params.bookId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
