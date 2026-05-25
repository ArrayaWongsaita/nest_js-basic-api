import { UseCase } from '../../../../shared/application/use-case';
import { TodoRepository } from '../../domain/repositories/todo.repository';
import { ListUserTodosResult } from '../dto/list-user-todos.result';
import { ListUserTodosQuery } from '../queries/list-user-todos.query';
import { mapTodoToResult } from './create-todo.use-case';

export class ListUserTodosUseCase
  implements UseCase<ListUserTodosQuery, ListUserTodosResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(query: ListUserTodosQuery): Promise<ListUserTodosResult> {
    const paginatedTodos = await this.todoRepository.findPageByUserId(
      query.userId,
      {
        isCompleted: query.isCompleted,
        search: query.search,
      },
      query.page,
      query.limit,
    );

    return {
      userId: query.userId,
      items: paginatedTodos.items.map(mapTodoToResult),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: paginatedTodos.totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(paginatedTodos.totalItems / query.limit),
        ),
      },
    };
  }
}
