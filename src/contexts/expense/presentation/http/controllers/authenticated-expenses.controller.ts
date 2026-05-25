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
  EXPENSE_CREATE_OWN_PERMISSION,
  EXPENSE_READ_OWN_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import { CreateExpenseCommand } from '../../../application/commands/create-expense.command';
import { DeleteExpenseCommand } from '../../../application/commands/delete-expense.command';
import { UpdateExpenseCommand } from '../../../application/commands/update-expense.command';
import { GetExpenseQuery } from '../../../application/queries/get-expense.query';
import { ListUserExpensesQuery } from '../../../application/queries/list-user-expenses.query';
import {
  CREATE_EXPENSE_USE_CASE,
  DELETE_EXPENSE_USE_CASE,
  GET_EXPENSE_USE_CASE,
  LIST_USER_EXPENSES_USE_CASE,
  UPDATE_EXPENSE_USE_CASE,
} from '../../../application/tokens';
import { CreateExpenseUseCase } from '../../../application/use-cases/create-expense.use-case';
import { DeleteExpenseUseCase } from '../../../application/use-cases/delete-expense.use-case';
import { GetExpenseUseCase } from '../../../application/use-cases/get-expense.use-case';
import { ListUserExpensesUseCase } from '../../../application/use-cases/list-user-expenses.use-case';
import { UpdateExpenseUseCase } from '../../../application/use-cases/update-expense.use-case';
import { ApiExpenseListQueryDocs } from '../decorators/api-expense-list-query-docs.decorator';
import { CreateExpenseBodyDto } from '../dto/create-expense-body.dto';
import {
  ListUserExpensesHttpResponseDto,
  ListUserExpensesResponseDto,
} from '../dto/list-user-expenses-response.dto';
import { ListExpensesQueryDto } from '../dto/list-expenses-query.dto';
import {
  ExpenseHttpResponseDto,
  ExpenseResponseDto,
} from '../dto/expense-response.dto';
import { ExpenseRouteParamsDto } from '../dto/expense-route-params.dto';
import { UpdateExpenseBodyDto } from '../dto/update-expense-body.dto';
import { ExpensePresenter } from '../presenters/expense.presenter';

@ApiTags('Expense Tracker (Authenticated)')
@ApiBearerAuth('access-token')
@Controller('transactions')
export class AuthenticatedExpensesController {
  constructor(
    @Inject(CREATE_EXPENSE_USE_CASE)
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    @Inject(LIST_USER_EXPENSES_USE_CASE)
    private readonly listUserExpensesUseCase: ListUserExpensesUseCase,
    @Inject(GET_EXPENSE_USE_CASE)
    private readonly getExpenseUseCase: GetExpenseUseCase,
    @Inject(UPDATE_EXPENSE_USE_CASE)
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    @Inject(DELETE_EXPENSE_USE_CASE)
    private readonly deleteExpenseUseCase: DeleteExpenseUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(EXPENSE_CREATE_OWN_PERMISSION)
  @ApiCreateEndpointDocs({
    summary: 'Create a transaction for the authenticated user',
    description: 'Creates a transaction for the user represented by the current Bearer access token.',
    badRequestDescription: 'The request payload failed validation.',
    successDescription: 'The transaction was created successfully.',
    responseType: ExpenseHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing expense.create_own.',
  )
  async createExpense(
    @Body() body: CreateExpenseBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<ExpenseResponseDto>> {
    const result = await this.createExpenseUseCase.execute(
      new CreateExpenseCommand(
        currentUser.userId,
        body.title,
        body.amount,
        body.type,
        body.note,
        body.transactionDate,
      ),
    );

    return createSuccessResponse(ExpensePresenter.toExpenseResponse(result));
  }

  @Get()
  @RequirePermissions(EXPENSE_READ_OWN_PERMISSION)
  @ApiListEndpointDocs({
    summary: 'List transactions for the authenticated user',
    description:
      'Returns a paginated list of transactions owned by the user represented by the current Bearer access token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The request query parameters could not be processed.',
    successDescription: 'Transactions owned by the authenticated user.',
    responseType: ListUserExpensesHttpResponseDto,
  })
  @ApiExpenseListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing expense.read_own.',
  )
  async listExpenses(
    @Query() query: ListExpensesQueryDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<
    HttpSuccessResponse<ListUserExpensesResponseDto, ReturnType<typeof ExpensePresenter.toExpenseListPaginationMeta>>
  > {
    const result = await this.listUserExpensesUseCase.execute(
      new ListUserExpensesQuery(
        currentUser.userId,
        query.search,
        query.type,
        query.page,
        query.limit,
      ),
    );

    return createSuccessResponse(
      ExpensePresenter.toUserExpenseListResponse(result),
      ExpensePresenter.toExpenseListPaginationMeta(result),
    );
  }

  @Get(':expenseId')
  @RequirePermissions(EXPENSE_READ_OWN_PERMISSION)
  @ApiReadEndpointDocs({
    summary: 'Read one transaction for the authenticated user',
    description: 'Returns one transaction owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The transaction was returned successfully.',
    responseType: ExpenseHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing expense.read_own.',
  )
  @ApiNotFoundErrorResponse('The requested transaction was not found.')
  async getExpense(
    @Param() params: ExpenseRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<ExpenseResponseDto>> {
    const result = await this.getExpenseUseCase.execute(
      new GetExpenseQuery(currentUser.userId, params.expenseId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(ExpensePresenter.toExpenseResponse(result.value));
  }

  @Patch(':expenseId')
  @RequirePermissions(EXPENSE_CREATE_OWN_PERMISSION)
  @ApiUpdateEndpointDocs({
    summary: 'Update one transaction for the authenticated user',
    description: 'Partially updates one transaction owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The transaction was updated successfully.',
    responseType: ExpenseHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing expense.create_own.',
  )
  @ApiNotFoundErrorResponse('The requested transaction was not found.')
  async updateExpense(
    @Param() params: ExpenseRouteParamsDto,
    @Body() body: UpdateExpenseBodyDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<HttpSuccessResponse<ExpenseResponseDto>> {
    const result = await this.updateExpenseUseCase.execute(
      new UpdateExpenseCommand(
        currentUser.userId,
        params.expenseId,
        body.title,
        body.amount,
        body.type,
        body.note,
        body.transactionDate,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(ExpensePresenter.toExpenseResponse(result.value));
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(EXPENSE_CREATE_OWN_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: 'Delete one transaction for the authenticated user',
    description: 'Deletes one transaction owned by the user represented by the current Bearer access token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The transaction was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse(
    'The authenticated user is missing expense.create_own.',
  )
  @ApiNotFoundErrorResponse('The requested transaction was not found.')
  async deleteExpense(
    @Param() params: ExpenseRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteExpenseUseCase.execute(
      new DeleteExpenseCommand(currentUser.userId, params.expenseId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
