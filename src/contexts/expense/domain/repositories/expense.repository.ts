import { TransactionType } from '../aggregates/expense.aggregate';
import { Expense } from '../aggregates/expense.aggregate';

export interface ExpenseListFilters {
  readonly search?: string;
  readonly type?: TransactionType;
}

export interface PaginatedExpenses {
  readonly items: Expense[];
  readonly totalItems: number;
}

export interface ExpenseRepository {
  save(expense: Expense): Promise<void>;
  findPageByUserId(
    userId: string,
    filters: ExpenseListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedExpenses>;
  findByIdAndUserId(expenseId: string, userId: string): Promise<Expense | null>;
  deleteByIdAndUserId(expenseId: string, userId: string): Promise<void>;
}
