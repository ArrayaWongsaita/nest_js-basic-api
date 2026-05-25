import { CreateTodoResult } from '../../../application/dto/create-todo.result';
import { ListUserTodosResult } from '../../../application/dto/list-user-todos.result';
import { TodoListPaginationMetaDto } from '../dto/todo-list-pagination-meta.dto';
import { ListUserTodosResponseDto } from '../dto/list-user-todos-response.dto';
import { TodoResponseDto } from '../dto/todo-response.dto';

export class TodoPresenter {
  static toTodoResponse(result: CreateTodoResult): TodoResponseDto {
    return {
      id: result.id,
      userId: result.userId,
      title: result.title,
      description: result.description,
      isCompleted: result.isCompleted,
      dueDate: result.dueDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static toUserTodoListResponse(
    result: ListUserTodosResult,
  ): ListUserTodosResponseDto {
    return {
      userId: result.userId,
      items: result.items.map((item) => this.toTodoResponse(item)),
    };
  }

  static toTodoListPaginationMeta(
    result: ListUserTodosResult,
  ): TodoListPaginationMetaDto {
    return {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.totalItems,
      totalPages: result.meta.totalPages,
    };
  }
}
