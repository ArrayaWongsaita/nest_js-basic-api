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
import { UpdateBookBodyDto } from '../dto/update-book-body.dto';
import { UserBookOwnerParamsDto } from '../dto/user-book-owner-params.dto';
import { UserBookRouteParamsDto } from '../dto/user-book-route-params.dto';
import { BookPresenter } from '../presenters/book.presenter';

@Public()
@ApiTags('Book Library (By User ID)')
@Controller('users/:userId/books')
export class UserBooksController {
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
  @ApiCreateEndpointDocs({
    summary: 'Create a book by user ID',
    description: 'Creates a book for the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The book was created successfully.',
    responseType: BookHttpResponseDto,
  })
  async createBook(
    @Param() params: UserBookOwnerParamsDto,
    @Body() body: CreateBookBodyDto,
  ): Promise<HttpSuccessResponse<BookResponseDto>> {
    const result = await this.createBookUseCase.execute(
      new CreateBookCommand(
        params.userId,
        body.title,
        body.author,
        body.genre,
        body.publishedYear,
      ),
    );

    return createSuccessResponse(BookPresenter.toBookResponse(result));
  }

  @Get()
  @ApiListEndpointDocs({
    summary: 'List books by user ID',
    description:
      'Returns a paginated list of books owned by the user identified directly in the route without using a Bearer token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The route parameters or query parameters failed validation.',
    successDescription: 'Books owned by the specified user.',
    responseType: ListUserBooksHttpResponseDto,
  })
  @ApiBookListQueryDocs()
  async listBooks(
    @Param() params: UserBookOwnerParamsDto,
    @Query() query: ListBooksQueryDto,
  ): Promise<
    HttpSuccessResponse<ListUserBooksResponseDto, ReturnType<typeof BookPresenter.toBookListPaginationMeta>>
  > {
    const result = await this.listUserBooksUseCase.execute(
      new ListUserBooksQuery(
        params.userId,
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
  @ApiReadEndpointDocs({
    summary: 'Read one book by user ID',
    description: 'Returns one book owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The book was returned successfully.',
    responseType: BookHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested book was not found for the specified user.',
  )
  async getBook(
    @Param() params: UserBookRouteParamsDto,
  ): Promise<HttpSuccessResponse<BookResponseDto>> {
    const result = await this.getBookUseCase.execute(
      new GetBookQuery(params.userId, params.bookId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(BookPresenter.toBookResponse(result.value));
  }

  @Patch(':bookId')
  @ApiUpdateEndpointDocs({
    summary: 'Update one book by user ID',
    description: 'Partially updates one book owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The book was updated successfully.',
    responseType: BookHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested book was not found for the specified user.',
  )
  async updateBook(
    @Param() params: UserBookRouteParamsDto,
    @Body() body: UpdateBookBodyDto,
  ): Promise<HttpSuccessResponse<BookResponseDto>> {
    const result = await this.updateBookUseCase.execute(
      new UpdateBookCommand(
        params.userId,
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
  @ApiDeleteEndpointDocs({
    summary: 'Delete one book by user ID',
    description: 'Deletes one book owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The book was deleted successfully.',
  })
  @ApiNotFoundErrorResponse(
    'The requested book was not found for the specified user.',
  )
  async deleteBook(@Param() params: UserBookRouteParamsDto): Promise<void> {
    const result = await this.deleteBookUseCase.execute(
      new DeleteBookCommand(params.userId, params.bookId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
