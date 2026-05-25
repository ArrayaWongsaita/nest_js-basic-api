import { UseCase } from '../../../../shared/application/use-case';
import { TransactionType } from '../../domain/aggregates/expense.aggregate';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { ListUserExpensesResult } from '../dto/list-user-expenses.result';
import { ListUserExpensesQuery } from '../queries/list-user-expenses.query';
import { mapExpenseToResult } from './create-expense.use-case';

export class ListUserExpensesUseCase
  implements UseCase<ListUserExpensesQuery, ListUserExpensesResult>
{
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(query: ListUserExpensesQuery): Promise<ListUserExpensesResult> {
    const paginatedExpenses = await this.expenseRepository.findPageByUserId(
      query.userId,
      {
        search: query.search,
        type: query.type as TransactionType | undefined,
      },
      query.page,
      query.limit,
    );

    return {
      userId: query.userId,
      items: paginatedExpenses.items.map(mapExpenseToResult),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: paginatedExpenses.totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(paginatedExpenses.totalItems / query.limit),
        ),
      },
    };
  }
}
