export class DeleteExpenseCommand {
  constructor(
    public readonly userId: string,
    public readonly expenseId: string,
  ) {}
}
