import { Todo } from '../aggregates/todo.aggregate';

export interface TodoListFilters {
  readonly isCompleted?: boolean;
  readonly search?: string;
}

export interface PaginatedTodos {
  readonly items: Todo[];
  readonly totalItems: number;
}

export interface TodoRepository {
  save(todo: Todo): Promise<void>;
  findPageByUserId(
    userId: string,
    filters: TodoListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedTodos>;
  findByIdAndUserId(todoId: string, userId: string): Promise<Todo | null>;
  deleteByIdAndUserId(todoId: string, userId: string): Promise<void>;
}
