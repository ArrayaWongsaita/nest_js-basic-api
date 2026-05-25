export class DeleteTodoCommand {
  constructor(
    public readonly userId: string,
    public readonly todoId: string,
  ) {}
}
