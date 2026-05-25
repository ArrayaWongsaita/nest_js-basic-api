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
import { UpdateExpenseBodyDto } from '../dto/update-expense-body.dto';
import { UserExpenseOwnerParamsDto } from '../dto/user-expense-owner-params.dto';
import { UserExpenseRouteParamsDto } from '../dto/user-expense-route-params.dto';
import { ExpensePresenter } from '../presenters/expense.presenter';

@Public()
@ApiTags('Expense Tracker (By User ID)')
@Controller('users/:userId/transactions')
export class UserExpensesController {
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
  @ApiCreateEndpointDocs({
    summary: 'Create a transaction by user ID',
    description: 'Creates a transaction for the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The transaction was created successfully.',
    responseType: ExpenseHttpResponseDto,
  })
  async createExpense(
    @Param() params: UserExpenseOwnerParamsDto,
    @Body() body: CreateExpenseBodyDto,
  ): Promise<HttpSuccessResponse<ExpenseResponseDto>> {
    const result = await this.createExpenseUseCase.execute(
      new CreateExpenseCommand(
        params.userId,
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
  @ApiListEndpointDocs({
    summary: 'List transactions by user ID',
    description:
      'Returns a paginated list of transactions owned by the user identified directly in the route without using a Bearer token. Optional query filters can narrow the result set.',
    badRequestDescription:
      'The route parameters or query parameters failed validation.',
    successDescription: 'Transactions owned by the specified user.',
    responseType: ListUserExpensesHttpResponseDto,
  })
  @ApiExpenseListQueryDocs()
  async listExpenses(
    @Param() params: UserExpenseOwnerParamsDto,
    @Query() query: ListExpensesQueryDto,
  ): Promise<
    HttpSuccessResponse<ListUserExpensesResponseDto, ReturnType<typeof ExpensePresenter.toExpenseListPaginationMeta>>
  > {
    const result = await this.listUserExpensesUseCase.execute(
      new ListUserExpensesQuery(
        params.userId,
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
  @ApiReadEndpointDocs({
    summary: 'Read one transaction by user ID',
    description: 'Returns one transaction owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The transaction was returned successfully.',
    responseType: ExpenseHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested transaction was not found for the specified user.',
  )
  async getExpense(
    @Param() params: UserExpenseRouteParamsDto,
  ): Promise<HttpSuccessResponse<ExpenseResponseDto>> {
    const result = await this.getExpenseUseCase.execute(
      new GetExpenseQuery(params.userId, params.expenseId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(ExpensePresenter.toExpenseResponse(result.value));
  }

  @Patch(':expenseId')
  @ApiUpdateEndpointDocs({
    summary: 'Update one transaction by user ID',
    description: 'Partially updates one transaction owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters or request payload failed validation.',
    successDescription: 'The transaction was updated successfully.',
    responseType: ExpenseHttpResponseDto,
  })
  @ApiNotFoundErrorResponse(
    'The requested transaction was not found for the specified user.',
  )
  async updateExpense(
    @Param() params: UserExpenseRouteParamsDto,
    @Body() body: UpdateExpenseBodyDto,
  ): Promise<HttpSuccessResponse<ExpenseResponseDto>> {
    const result = await this.updateExpenseUseCase.execute(
      new UpdateExpenseCommand(
        params.userId,
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
  @ApiDeleteEndpointDocs({
    summary: 'Delete one transaction by user ID',
    description: 'Deletes one transaction owned by the user identified directly in the route without using a Bearer token.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The transaction was deleted successfully.',
  })
  @ApiNotFoundErrorResponse(
    'The requested transaction was not found for the specified user.',
  )
  async deleteExpense(@Param() params: UserExpenseRouteParamsDto): Promise<void> {
    const result = await this.deleteExpenseUseCase.execute(
      new DeleteExpenseCommand(params.userId, params.expenseId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
