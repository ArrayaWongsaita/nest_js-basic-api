export class ListUserTodosQuery {
  constructor(
    public readonly userId: string,
    public readonly isCompleted: boolean | undefined,
    public readonly search: string | undefined,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
