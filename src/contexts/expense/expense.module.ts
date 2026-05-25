import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import {
  CREATE_EXPENSE_USE_CASE,
  DELETE_EXPENSE_USE_CASE,
  GET_EXPENSE_USE_CASE,
  LIST_USER_EXPENSES_USE_CASE,
  EXPENSE_REPOSITORY,
  UPDATE_EXPENSE_USE_CASE,
} from './application/tokens';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense.use-case';
import { GetExpenseUseCase } from './application/use-cases/get-expense.use-case';
import { ListUserExpensesUseCase } from './application/use-cases/list-user-expenses.use-case';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';
import { PrismaExpenseRepository } from './infrastructure/persistence/prisma/prisma-expense.repository';
import { AuthenticatedExpensesController } from './presentation/http/controllers/authenticated-expenses.controller';
import { UserExpensesController } from './presentation/http/controllers/user-expenses.controller';

@Module({
  imports: [DbModule],
  controllers: [AuthenticatedExpensesController, UserExpensesController],
  providers: [
    {
      provide: EXPENSE_REPOSITORY,
      useClass: PrismaExpenseRepository,
    },
    {
      provide: CREATE_EXPENSE_USE_CASE,
      useFactory: (expenseRepository: PrismaExpenseRepository) =>
        new CreateExpenseUseCase(expenseRepository),
      inject: [EXPENSE_REPOSITORY],
    },
    {
      provide: LIST_USER_EXPENSES_USE_CASE,
      useFactory: (expenseRepository: PrismaExpenseRepository) =>
        new ListUserExpensesUseCase(expenseRepository),
      inject: [EXPENSE_REPOSITORY],
    },
    {
      provide: GET_EXPENSE_USE_CASE,
      useFactory: (expenseRepository: PrismaExpenseRepository) =>
        new GetExpenseUseCase(expenseRepository),
      inject: [EXPENSE_REPOSITORY],
    },
    {
      provide: UPDATE_EXPENSE_USE_CASE,
      useFactory: (expenseRepository: PrismaExpenseRepository) =>
        new UpdateExpenseUseCase(expenseRepository),
      inject: [EXPENSE_REPOSITORY],
    },
    {
      provide: DELETE_EXPENSE_USE_CASE,
      useFactory: (expenseRepository: PrismaExpenseRepository) =>
        new DeleteExpenseUseCase(expenseRepository),
      inject: [EXPENSE_REPOSITORY],
    },
  ],
})
export class ExpenseModule {}
