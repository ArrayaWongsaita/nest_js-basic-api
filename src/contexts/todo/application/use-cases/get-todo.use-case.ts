import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { TodoRepository } from '../../domain/repositories/todo.repository';
import { CreateTodoResult } from '../dto/create-todo.result';
import { GetTodoQuery } from '../queries/get-todo.query';
import { mapTodoToResult } from './create-todo.use-case';

export class GetTodoUseCase
  implements UseCase<GetTodoQuery, Result<CreateTodoResult, string>>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(
    query: GetTodoQuery,
  ): Promise<Result<CreateTodoResult, string>> {
    const todo = await this.todoRepository.findByIdAndUserId(
      query.todoId,
      query.userId,
    );

    if (!todo) {
      return Result.failure('Todo item was not found.');
    }

    return Result.success(mapTodoToResult(todo));
  }
}
