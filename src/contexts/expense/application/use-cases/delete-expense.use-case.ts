import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { DeleteExpenseCommand } from '../commands/delete-expense.command';

export class DeleteExpenseUseCase
  implements UseCase<DeleteExpenseCommand, Result<void, string>>
{
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(command: DeleteExpenseCommand): Promise<Result<void, string>> {
    const expense = await this.expenseRepository.findByIdAndUserId(
      command.expenseId,
      command.userId,
    );

    if (!expense) {
      return Result.failure('Expense was not found.');
    }

    await this.expenseRepository.deleteByIdAndUserId(command.expenseId, command.userId);

    return Result.success(undefined);
  }
}
