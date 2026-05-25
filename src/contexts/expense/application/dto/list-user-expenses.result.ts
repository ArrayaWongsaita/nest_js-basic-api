import { CreateExpenseResult } from './create-expense.result';

export interface ExpenseListPaginationResult {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ListUserExpensesResult {
  readonly userId: string;
  readonly items: CreateExpenseResult[];
  readonly meta: ExpenseListPaginationResult;
}
