import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import { ForExistingUser } from '../../shared/application/for-existing-user';
import { USER_EXISTENCE } from '../../shared/application/tokens';
import type { UserExistencePort } from '../../shared/application/user-existence.port';
import { AuditedAction } from '../iam/application/audit/audited-action';
import type { AuditLogPort } from '../iam/application/ports/audit-log.port';
import { AUDIT_LOG } from '../iam/application/tokens';
import { IamModule } from '../iam/iam.module';
import { describeAdminTodoDeletion } from './application/audit/todo-audit-descriptors';
import { ListUserTodosAsResultUseCase } from './application/use-cases/list-user-todos-as-result.use-case';
import { AdminUserTodosController } from './presentation/http/controllers/admin-user-todos.controller';
import {
  ADMIN_DELETE_USER_TODO_USE_CASE,
  ADMIN_GET_USER_TODO_USE_CASE,
  ADMIN_LIST_USER_TODOS_USE_CASE,
  CREATE_TODO_USE_CASE,
  DELETE_TODO_USE_CASE,
  GET_TODO_USE_CASE,
  LIST_USER_TODOS_USE_CASE,
  TODO_REPOSITORY,
  UPDATE_TODO_USE_CASE,
} from './application/tokens';
import { CreateTodoUseCase } from './application/use-cases/create-todo.use-case';
import { DeleteTodoUseCase } from './application/use-cases/delete-todo.use-case';
import { GetTodoUseCase } from './application/use-cases/get-todo.use-case';
import { ListUserTodosUseCase } from './application/use-cases/list-user-todos.use-case';
import { UpdateTodoUseCase } from './application/use-cases/update-todo.use-case';
import { PrismaTodoRepository } from './infrastructure/persistence/prisma/prisma-todo.repository';
import { AuthenticatedTodosController } from './presentation/http/controllers/authenticated-todos.controller';

@Module({
  imports: [DbModule, IamModule],
  controllers: [AuthenticatedTodosController, AdminUserTodosController],
  providers: [
    {
      provide: TODO_REPOSITORY,
      useClass: PrismaTodoRepository,
    },
    {
      provide: CREATE_TODO_USE_CASE,
      useFactory: (todoRepository: PrismaTodoRepository) =>
        new CreateTodoUseCase(todoRepository),
      inject: [TODO_REPOSITORY],
    },
    {
      provide: LIST_USER_TODOS_USE_CASE,
      useFactory: (todoRepository: PrismaTodoRepository) =>
        new ListUserTodosUseCase(todoRepository),
      inject: [TODO_REPOSITORY],
    },
    {
      provide: GET_TODO_USE_CASE,
      useFactory: (todoRepository: PrismaTodoRepository) =>
        new GetTodoUseCase(todoRepository),
      inject: [TODO_REPOSITORY],
    },
    {
      provide: UPDATE_TODO_USE_CASE,
      useFactory: (todoRepository: PrismaTodoRepository) =>
        new UpdateTodoUseCase(todoRepository),
      inject: [TODO_REPOSITORY],
    },
    {
      provide: DELETE_TODO_USE_CASE,
      useFactory: (todoRepository: PrismaTodoRepository) =>
        new DeleteTodoUseCase(todoRepository),
      inject: [TODO_REPOSITORY],
    },
    {
      provide: ADMIN_LIST_USER_TODOS_USE_CASE,
      useFactory: (
        todoRepository: PrismaTodoRepository,
        users: UserExistencePort,
      ) =>
        new ForExistingUser(
          new ListUserTodosAsResultUseCase(
            new ListUserTodosUseCase(todoRepository),
          ),
          users,
        ),
      inject: [TODO_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_GET_USER_TODO_USE_CASE,
      useFactory: (
        todoRepository: PrismaTodoRepository,
        users: UserExistencePort,
      ) => new ForExistingUser(new GetTodoUseCase(todoRepository), users),
      inject: [TODO_REPOSITORY, USER_EXISTENCE],
    },
    {
      provide: ADMIN_DELETE_USER_TODO_USE_CASE,
      useFactory: (
        todoRepository: PrismaTodoRepository,
        users: UserExistencePort,
        auditLog: AuditLogPort,
      ) =>
        new AuditedAction(
          new ForExistingUser(new DeleteTodoUseCase(todoRepository), users),
          auditLog,
          describeAdminTodoDeletion,
        ),
      inject: [TODO_REPOSITORY, USER_EXISTENCE, AUDIT_LOG],
    },
  ],
})
export class TodoModule {}
