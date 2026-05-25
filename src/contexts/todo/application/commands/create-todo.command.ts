export class CreateTodoCommand {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly dueDate: string | null,
  ) {}
}
