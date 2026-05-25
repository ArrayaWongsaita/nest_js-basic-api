import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

type ExpenseProps = {
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  note: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

type CreateExpenseProps = {
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  note?: string | null;
  transactionDate: Date;
};

type UpdateExpenseProps = {
  title?: string;
  amount?: number;
  type?: TransactionType;
  note?: string | null;
  transactionDate?: Date;
};

export class Expense extends AggregateRoot<ExpenseProps> {
  private constructor(props: ExpenseProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateExpenseProps): Expense {
    const now = new Date();

    return new Expense(
      {
        userId: props.userId,
        title: props.title,
        amount: props.amount,
        type: props.type,
        note: props.note ?? null,
        transactionDate: props.transactionDate,
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  static rehydrate(props: ExpenseProps, id: UniqueEntityId): Expense {
    return new Expense(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get amount(): number {
    return this.props.amount;
  }

  get type(): TransactionType {
    return this.props.type;
  }

  get note(): string | null {
    return this.props.note;
  }

  get transactionDate(): Date {
    return this.props.transactionDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(props: UpdateExpenseProps): void {
    if (props.title !== undefined) {
      this.props.title = props.title;
    }

    if (props.amount !== undefined) {
      this.props.amount = props.amount;
    }

    if (props.type !== undefined) {
      this.props.type = props.type;
    }

    if (props.note !== undefined) {
      this.props.note = props.note;
    }

    if (props.transactionDate !== undefined) {
      this.props.transactionDate = props.transactionDate;
    }

    this.props.updatedAt = new Date();
  }
}
