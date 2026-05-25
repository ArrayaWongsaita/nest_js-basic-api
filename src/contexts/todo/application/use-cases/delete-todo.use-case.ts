import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { TodoRepository } from '../../domain/repositories/todo.repository';
import { DeleteTodoCommand } from '../commands/delete-todo.command';

export class DeleteTodoUseCase
  implements UseCase<DeleteTodoCommand, Result<void, string>>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(command: DeleteTodoCommand): Promise<Result<void, string>> {
    const todo = await this.todoRepository.findByIdAndUserId(
      command.todoId,
      command.userId,
    );

    if (!todo) {
      return Result.failure('Todo item was not found.');
    }

    await this.todoRepository.deleteByIdAndUserId(command.todoId, command.userId);

    return Result.success(undefined);
  }
}
