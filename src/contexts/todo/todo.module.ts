import { Module } from '@nestjs/common';
import { DbModule } from '../../shared/infrastructure/database';
import {
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
import { UserTodosController } from './presentation/http/controllers/user-todos.controller';

@Module({
  imports: [DbModule],
  controllers: [AuthenticatedTodosController, UserTodosController],
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
  ],
})
export class TodoModule {}
