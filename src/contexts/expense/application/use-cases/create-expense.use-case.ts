import { UseCase } from '../../../../shared/application/use-case';
import { Expense, TransactionType } from '../../domain/aggregates/expense.aggregate';
import { ExpenseRepository } from '../../domain/repositories/expense.repository';
import { CreateExpenseCommand } from '../commands/create-expense.command';
import { CreateExpenseResult } from '../dto/create-expense.result';

export class CreateExpenseUseCase
  implements UseCase<CreateExpenseCommand, CreateExpenseResult>
{
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(command: CreateExpenseCommand): Promise<CreateExpenseResult> {
    const expense = Expense.create({
      userId: command.userId,
      title: command.title,
      amount: command.amount,
      type: command.type as TransactionType,
      note: command.note,
      transactionDate: new Date(command.transactionDate),
    });

    await this.expenseRepository.save(expense);

    return mapExpenseToResult(expense);
  }
}

export function mapExpenseToResult(expense: Expense): CreateExpenseResult {
  return {
    id: expense.id.toString(),
    userId: expense.userId,
    title: expense.title,
    amount: expense.amount,
    type: expense.type,
    note: expense.note,
    transactionDate: expense.transactionDate.toISOString(),
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}
