export class UpdateTodoCommand {
  constructor(
    public readonly userId: string,
    public readonly todoId: string,
    public readonly title?: string,
    public readonly description?: string | null,
    public readonly isCompleted?: boolean,
    public readonly dueDate?: string | null,
  ) {}
}
