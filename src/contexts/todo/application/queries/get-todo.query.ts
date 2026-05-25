export class GetTodoQuery {
  constructor(
    public readonly userId: string,
    public readonly todoId: string,
  ) {}
}
