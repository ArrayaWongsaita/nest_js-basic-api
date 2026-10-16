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
  EXPENSE_DELETE_ANY_PERMISSION,
  EXPENSE_READ_ANY_PERMISSION,
} from '../../../../iam/domain/constants/permission-name.constants';
import type { AuditedAdminDeleteUserExpense } from '../../../application/audit/expense-audit-descriptors';
import { DeleteExpenseCommand } from '../../../application/commands/delete-expense.command';
import { CreateExpenseResult } from '../../../application/dto/create-expense.result';
import { ListUserExpensesResult } from '../../../application/dto/list-user-expenses.result';
import { GetExpenseQuery } from '../../../application/queries/get-expense.query';
import { ListUserExpensesQuery } from '../../../application/queries/list-user-expenses.query';
import {
  ADMIN_DELETE_USER_EXPENSE_USE_CASE,
  ADMIN_GET_USER_EXPENSE_USE_CASE,
  ADMIN_LIST_USER_EXPENSES_USE_CASE,
} from '../../../application/tokens';
import { ApiExpenseListQueryDocs } from '../decorators/api-expense-list-query-docs.decorator';
import {
  AdminExpenseOwnerRouteParamsDto,
  AdminUserExpenseRouteParamsDto,
} from '../dto/admin-user-expense-route-params.dto';
import { ListExpensesQueryDto } from '../dto/list-expenses-query.dto';
import {
  ListUserExpensesHttpResponseDto,
  ListUserExpensesResponseDto,
} from '../dto/list-user-expenses-response.dto';
import {
  ExpenseHttpResponseDto,
  ExpenseResponseDto,
} from '../dto/expense-response.dto';
import { ExpensePresenter } from '../presenters/expense.presenter';

/**
 * Admin moderation of another user's expenses: list, view, delete. There is
 * deliberately no update route.
 */
@ApiTags('Admin User Expenses')
@ApiBearerAuth('access-token')
@Controller('admin/users/:userId/transactions')
export class AdminUserExpensesController {
  constructor(
    @Inject(ADMIN_LIST_USER_EXPENSES_USE_CASE)
    private readonly listUserExpenses: UseCase<
      ListUserExpensesQuery,
      Result<ListUserExpensesResult, string>
    >,
    @Inject(ADMIN_GET_USER_EXPENSE_USE_CASE)
    private readonly getUserExpense: UseCase<
      GetExpenseQuery,
      Result<CreateExpenseResult, string>
    >,
    @Inject(ADMIN_DELETE_USER_EXPENSE_USE_CASE)
    private readonly deleteUserExpense: AuditedAdminDeleteUserExpense,
  ) {}

  @Get()
  @RequirePermissions(EXPENSE_READ_ANY_PERMISSION)
  @ApiListEndpointDocs({
    summary: "List another user's expenses",
    description:
      'Returns a paginated list of expenses owned by the given user. Admin moderation route.',
    badRequestDescription:
      'The route or query parameters could not be processed.',
    successDescription: 'Expense items owned by the given user.',
    responseType: ListUserExpensesHttpResponseDto,
  })
  @ApiExpenseListQueryDocs()
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing expense.read_any.')
  @ApiNotFoundErrorResponse('The requested user was not found.')
  async listExpenses(
    @Param() params: AdminExpenseOwnerRouteParamsDto,
    @Query() query: ListExpensesQueryDto,
  ): Promise<
    HttpSuccessResponse<
      ListUserExpensesResponseDto,
      ReturnType<typeof ExpensePresenter.toExpenseListPaginationMeta>
    >
  > {
    const result = await this.listUserExpenses.execute(
      new ListUserExpensesQuery(
        params.userId,
        query.search,
        query.type,
        query.page,
        query.limit,
      ),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      ExpensePresenter.toUserExpenseListResponse(result.value),
      ExpensePresenter.toExpenseListPaginationMeta(result.value),
    );
  }

  @Get(':expenseId')
  @RequirePermissions(EXPENSE_READ_ANY_PERMISSION)
  @ApiReadEndpointDocs({
    summary: "Read one of another user's expenses",
    description:
      'Returns one expense owned by the given user. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The expense was returned successfully.',
    responseType: ExpenseHttpResponseDto,
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing expense.read_any.')
  @ApiNotFoundErrorResponse('The requested user or expense was not found.')
  async getExpense(
    @Param() params: AdminUserExpenseRouteParamsDto,
  ): Promise<HttpSuccessResponse<ExpenseResponseDto>> {
    const result = await this.getUserExpense.execute(
      new GetExpenseQuery(params.userId, params.expenseId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }

    return createSuccessResponse(
      ExpensePresenter.toExpenseResponse(result.value),
    );
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(EXPENSE_DELETE_ANY_PERMISSION)
  @ApiDeleteEndpointDocs({
    summary: "Delete one of another user's expenses",
    description:
      'Deletes one expense owned by the given user and records the deletion in the audit log. Admin moderation route.',
    badRequestDescription: 'The route parameters failed validation.',
    successDescription: 'The expense was deleted successfully.',
  })
  @ApiUnauthorizedErrorResponse('A valid Bearer access token is required.')
  @ApiForbiddenErrorResponse('The caller is missing expense.delete_any.')
  @ApiNotFoundErrorResponse('The requested user or expense was not found.')
  async deleteExpense(
    @Param() params: AdminUserExpenseRouteParamsDto,
    @CurrentUser() currentUser: AuthenticatedUserContext,
  ): Promise<void> {
    const result = await this.deleteUserExpense.execute(
      currentUser.userId,
      new DeleteExpenseCommand(params.userId, params.expenseId),
    );

    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
  }
}
