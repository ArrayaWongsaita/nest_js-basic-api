export class ListUserExpensesQuery {
  constructor(
    public readonly userId: string,
    public readonly search: string | undefined,
    public readonly type: string | undefined,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
