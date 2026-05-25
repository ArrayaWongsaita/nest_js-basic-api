import { CreateExpenseResult } from '../../../application/dto/create-expense.result';
import { ListUserExpensesResult } from '../../../application/dto/list-user-expenses.result';
import { ExpenseListPaginationMetaDto } from '../dto/expense-list-pagination-meta.dto';
import { ListUserExpensesResponseDto } from '../dto/list-user-expenses-response.dto';
import { ExpenseResponseDto } from '../dto/expense-response.dto';

export class ExpensePresenter {
  static toExpenseResponse(result: CreateExpenseResult): ExpenseResponseDto {
    return {
      id: result.id,
      userId: result.userId,
      title: result.title,
      amount: result.amount,
      type: result.type as 'INCOME' | 'EXPENSE',
      note: result.note,
      transactionDate: result.transactionDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static toUserExpenseListResponse(
    result: ListUserExpensesResult,
  ): ListUserExpensesResponseDto {
    return {
      userId: result.userId,
      items: result.items.map((item) => this.toExpenseResponse(item)),
    };
  }

  static toExpenseListPaginationMeta(
    result: ListUserExpensesResult,
  ): ExpenseListPaginationMetaDto {
    return {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.totalItems,
      totalPages: result.meta.totalPages,
    };
  }
}
