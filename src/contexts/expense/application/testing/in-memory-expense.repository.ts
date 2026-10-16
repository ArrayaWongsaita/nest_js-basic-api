import { Expense } from '../../domain/aggregates/expense.aggregate';
import {
  ExpenseListFilters,
  ExpenseRepository,
  PaginatedExpenses,
} from '../../domain/repositories/expense.repository';

/** In-memory ExpenseRepository for specs and e2e tests. */
export class InMemoryExpenseRepository implements ExpenseRepository {
  private readonly expenses = new Map<string, Expense>();

  save(expense: Expense): Promise<void> {
    this.expenses.set(expense.id.toString(), expense);

    return Promise.resolve();
  }

  findPageByUserId(
    userId: string,
    filters: ExpenseListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedExpenses> {
    const search = filters.search?.trim().toLowerCase();
    const matching = [...this.expenses.values()]
      .filter((e) => e.userId === userId)
      .filter((e) => filters.type === undefined || e.type === filters.type)
      .filter(
        (e) =>
          !search ||
          [e.title, e.note ?? ''].some((text) =>
            text.toLowerCase().includes(search),
          ),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve({
      items: matching.slice((page - 1) * limit, page * limit),
      totalItems: matching.length,
    });
  }

  findByIdAndUserId(
    expenseId: string,
    userId: string,
  ): Promise<Expense | null> {
    const expense = this.expenses.get(expenseId);

    return Promise.resolve(
      expense && expense.userId === userId ? expense : null,
    );
  }

  deleteByIdAndUserId(expenseId: string, userId: string): Promise<void> {
    if (this.expenses.get(expenseId)?.userId === userId) {
      this.expenses.delete(expenseId);
    }

    return Promise.resolve();
  }
}
