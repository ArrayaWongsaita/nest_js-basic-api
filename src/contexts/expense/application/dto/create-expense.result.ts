export interface CreateExpenseResult {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly amount: number;
  readonly type: string;
  readonly note: string | null;
  readonly transactionDate: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
