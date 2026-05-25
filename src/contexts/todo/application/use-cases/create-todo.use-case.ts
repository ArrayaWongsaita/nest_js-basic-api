import { UseCase } from '../../../../shared/application/use-case';
import { Todo } from '../../domain/aggregates/todo.aggregate';
import { TodoRepository } from '../../domain/repositories/todo.repository';
import { CreateTodoCommand } from '../commands/create-todo.command';
import { CreateTodoResult } from '../dto/create-todo.result';

export class CreateTodoUseCase
  implements UseCase<CreateTodoCommand, CreateTodoResult>
{
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(command: CreateTodoCommand): Promise<CreateTodoResult> {
    const todo = Todo.create({
      userId: command.userId,
      title: command.title,
      description: command.description,
      dueDate: command.dueDate ? new Date(command.dueDate) : null,
    });

    await this.todoRepository.save(todo);

    return mapTodoToResult(todo);
  }
}

export function mapTodoToResult(todo: Todo): CreateTodoResult {
  return {
    id: todo.id.toString(),
    userId: todo.userId,
    title: todo.title,
    description: todo.description,
    isCompleted: todo.isCompleted,
    dueDate: todo.dueDate?.toISOString() ?? null,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}
