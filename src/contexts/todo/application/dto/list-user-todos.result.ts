import { CreateTodoResult } from './create-todo.result';

export interface TodoListPaginationResult {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ListUserTodosResult {
  readonly userId: string;
  readonly items: CreateTodoResult[];
  readonly meta: TodoListPaginationResult;
}
