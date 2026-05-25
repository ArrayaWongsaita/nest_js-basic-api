import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { TodoRepository } from '../../domain/repositories/todo.repository';
import { CreateTodoResult } from '../dto/create-todo.result';
import { UpdateTodoCommand } from '../commands/update-todo.command';
import { mapTodoToResult } from './create-todo.use-case';

export class UpdateTodoUseCase
  implements UseCase<UpdateTodoCommand, Result<CreateTodoResult, string>>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(
    command: UpdateTodoCommand,
  ): Promise<Result<CreateTodoResult, string>> {
    const todo = await this.todoRepository.findByIdAndUserId(
      command.todoId,
      command.userId,
    );

    if (!todo) {
      return Result.failure('Todo item was not found.');
    }

    todo.update({
      title: command.title,
      description: command.description,
      isCompleted: command.isCompleted,
      dueDate:
        command.dueDate === undefined
          ? undefined
          : command.dueDate === null
            ? null
            : new Date(command.dueDate),
    });

    await this.todoRepository.save(todo);

    return Result.success(mapTodoToResult(todo));
  }
}
