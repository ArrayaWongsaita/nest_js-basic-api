export class UpdateExpenseCommand {
  constructor(
    public readonly userId: string,
    public readonly expenseId: string,
    public readonly title?: string,
    public readonly amount?: number,
    public readonly type?: string,
    public readonly note?: string | null,
    public readonly transactionDate?: string,
  ) {}
}
