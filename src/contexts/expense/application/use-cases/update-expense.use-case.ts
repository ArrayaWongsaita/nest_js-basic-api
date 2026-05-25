import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { TransactionType } from '../../domain/aggregates/expense.aggregate';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { CreateExpenseResult } from '../dto/create-expense.result';
import { UpdateExpenseCommand } from '../commands/update-expense.command';
import { mapExpenseToResult } from './create-expense.use-case';

export class UpdateExpenseUseCase
  implements UseCase<UpdateExpenseCommand, Result<CreateExpenseResult, string>>
{
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(
    command: UpdateExpenseCommand,
  ): Promise<Result<CreateExpenseResult, string>> {
    const expense = await this.expenseRepository.findByIdAndUserId(
      command.expenseId,
      command.userId,
    );

    if (!expense) {
      return Result.failure('Expense was not found.');
    }

    expense.update({
      title: command.title,
      amount: command.amount,
      type:
        command.type === undefined
          ? undefined
          : (command.type as TransactionType),
      note: command.note,
      transactionDate:
        command.transactionDate === undefined
          ? undefined
          : new Date(command.transactionDate),
    });

    await this.expenseRepository.save(expense);

    return Result.success(mapExpenseToResult(expense));
  }
}
