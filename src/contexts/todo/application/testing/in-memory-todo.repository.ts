import { Todo } from '../../domain/aggregates/todo.aggregate';
import {
  PaginatedTodos,
  TodoListFilters,
  TodoRepository,
} from '../../domain/repositories/todo.repository';

/** In-memory TodoRepository for specs and e2e tests. */
export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos = new Map<string, Todo>();

  save(todo: Todo): Promise<void> {
    this.todos.set(todo.id.toString(), todo);

    return Promise.resolve();
  }

  findPageByUserId(
    userId: string,
    filters: TodoListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedTodos> {
    const search = filters.search?.trim().toLowerCase();
    const matching = [...this.todos.values()]
      .filter((todo) => todo.userId === userId)
      .filter(
        (todo) =>
          filters.isCompleted === undefined ||
          todo.isCompleted === filters.isCompleted,
      )
      .filter(
        (todo) =>
          !search ||
          todo.title.toLowerCase().includes(search) ||
          (todo.description ?? '').toLowerCase().includes(search),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve({
      items: matching.slice((page - 1) * limit, page * limit),
      totalItems: matching.length,
    });
  }

  findByIdAndUserId(todoId: string, userId: string): Promise<Todo | null> {
    const todo = this.todos.get(todoId);

    return Promise.resolve(todo && todo.userId === userId ? todo : null);
  }

  deleteByIdAndUserId(todoId: string, userId: string): Promise<void> {
    if (this.todos.get(todoId)?.userId === userId) {
      this.todos.delete(todoId);
    }

    return Promise.resolve();
  }
}
