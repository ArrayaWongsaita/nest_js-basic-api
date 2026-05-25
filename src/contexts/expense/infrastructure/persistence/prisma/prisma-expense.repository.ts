import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../../shared/domain/unique-entity-id';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { Expense, TransactionType } from '../../../domain/aggregates/expense.aggregate';
import {
  PaginatedExpenses,
  ExpenseListFilters,
  ExpenseRepository,
} from '../../../domain/repositories/expense.repository';

@Injectable()
export class PrismaExpenseRepository implements ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(expense: Expense): Promise<void> {
    await this.prisma.financialTransaction.upsert({
      where: {
        id: expense.id.toString(),
      },
      create: {
        id: expense.id.toString(),
        userId: expense.userId,
        title: expense.title,
        amount: expense.amount,
        type: expense.type,
        note: expense.note,
        transactionDate: expense.transactionDate,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      },
      update: {
        title: expense.title,
        amount: expense.amount,
        type: expense.type,
        note: expense.note,
        transactionDate: expense.transactionDate,
        updatedAt: expense.updatedAt,
      },
    });
  }

  async findPageByUserId(
    userId: string,
    filters: ExpenseListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedExpenses> {
    const where = createExpenseWhereClause(userId, filters);
    const skip = (page - 1) * limit;

    const [expenseRecords, totalItems] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.financialTransaction.count({
        where,
      }),
    ]);

    return {
      items: expenseRecords.map(mapExpenseRecordToAggregate),
      totalItems,
    };
  }

  async findByIdAndUserId(expenseId: string, userId: string): Promise<Expense | null> {
    const expenseRecord = await this.prisma.financialTransaction.findFirst({
      where: {
        id: expenseId,
        userId,
      },
    });

    return expenseRecord ? mapExpenseRecordToAggregate(expenseRecord) : null;
  }

  async deleteByIdAndUserId(expenseId: string, userId: string): Promise<void> {
    await this.prisma.financialTransaction.deleteMany({
      where: {
        id: expenseId,
        userId,
      },
    });
  }
}

function createExpenseWhereClause(userId: string, filters: ExpenseListFilters) {
  const trimmedSearch = filters.search?.trim();

  return {
    userId,
    ...(filters.type === undefined
      ? {}
      : {
          type: filters.type,
        }),
    ...(trimmedSearch
      ? {
          OR: [
            {
              title: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              note: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
}

function mapExpenseRecordToAggregate(expenseRecord: {
  id: string;
  userId: string;
  title: string;
  amount: number | { toNumber(): number };
  type: string;
  note: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}): Expense {
  const rawAmount =
    typeof expenseRecord.amount === 'number'
      ? expenseRecord.amount
      : expenseRecord.amount.toNumber();

  return Expense.rehydrate(
    {
      userId: expenseRecord.userId,
      title: expenseRecord.title,
      amount: rawAmount,
      type: expenseRecord.type as TransactionType,
      note: expenseRecord.note,
      transactionDate: expenseRecord.transactionDate,
      createdAt: expenseRecord.createdAt,
      updatedAt: expenseRecord.updatedAt,
    },
    new UniqueEntityId(expenseRecord.id),
  );
}
