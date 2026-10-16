import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import { ForExistingUser } from '../../shared/application/for-existing-user';
import { USER_EXISTENCE } from '../../shared/application/tokens';
import type { UserExistencePort } from '../../shared/application/user-existence.port';
import { AuditedAction } from '../iam/application/audit/audited-action';
import type { AuditLogPort } from '../iam/application/ports/audit-log.port';
import { AUDIT_LOG } from '../iam/application/tokens';
import { IamModule } from '../iam/iam.module';
import { describeAdminExpenseDeletion } from './application/audit/expense-audit-descriptors';
import { ListUserExpensesAsResultUseCase } from './application/use-cases/list-user-expenses-as-result.use-case';
import { AdminUserExpensesController } from './presentation/http/controllers/admin-user-expenses.controller';
import {
  ADMIN_DELETE_USER_EXPENSE_USE_CASE,
  ADMIN_GET_USER_EXPENSE_USE_CASE,
  ADMIN_LIST_USER_EXPENSES_USE_CASE,
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

@Module({
  imports: [DbModule, IamModule],
  controllers: [AuthenticatedExpensesController, AdminUserExpensesController],
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
    {
      provide: ADMIN_LIST_USER_EXPENSES_USE_CASE,
      useFactory: (
        expenseRepository: PrismaExpenseRepository,
        users: UserExistencePort,
      ) =>
        new ForExistingUser(
          new ListUserExpensesAsResultUseCase(
            new ListUserExpensesUseCase(expenseRepository),
          ),
          users,
        ),
      inject: [EXPENSE_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_GET_USER_EXPENSE_USE_CASE,
      useFactory: (
        expenseRepository: PrismaExpenseRepository,
        users: UserExistencePort,
      ) => new ForExistingUser(new GetExpenseUseCase(expenseRepository), users),
      inject: [EXPENSE_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_DELETE_USER_EXPENSE_USE_CASE,
      useFactory: (
        expenseRepository: PrismaExpenseRepository,
        users: UserExistencePort,
        auditLog: AuditLogPort,
      ) =>
        new AuditedAction(
          new ForExistingUser(new DeleteExpenseUseCase(expenseRepository), users),
          auditLog,
          describeAdminExpenseDeletion,
        ),
      inject: [EXPENSE_REPOSITORY, USER_EXISTENCE, AUDIT_LOG],
    },
  ],
})
export class ExpenseModule {}
