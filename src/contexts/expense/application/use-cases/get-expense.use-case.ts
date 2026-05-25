import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { CreateExpenseResult } from '../dto/create-expense.result';
import { GetExpenseQuery } from '../queries/get-expense.query';
import { mapExpenseToResult } from './create-expense.use-case';

export class GetExpenseUseCase
  implements UseCase<GetExpenseQuery, Result<CreateExpenseResult, string>>
{
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(
    query: GetExpenseQuery,
  ): Promise<Result<CreateExpenseResult, string>> {
    const expense = await this.expenseRepository.findByIdAndUserId(
      query.expenseId,
      query.userId,
    );

    if (!expense) {
      return Result.failure('Expense was not found.');
    }

    return Result.success(mapExpenseToResult(expense));
  }
}
