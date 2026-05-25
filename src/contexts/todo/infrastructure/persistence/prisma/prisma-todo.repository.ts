import { Injectable } from '@nestjs/common';
import { UniqueEntityId } from '../../../../../shared/domain/unique-entity-id';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma.service';
import { Todo } from '../../../domain/aggregates/todo.aggregate';
import {
  PaginatedTodos,
  TodoListFilters,
  TodoRepository,
} from '../../../domain/repositories/todo.repository';

@Injectable()
export class PrismaTodoRepository implements TodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(todo: Todo): Promise<void> {
    await this.prisma.todo.upsert({
      where: {
        id: todo.id.toString(),
      },
      create: {
        id: todo.id.toString(),
        userId: todo.userId,
        title: todo.title,
        description: todo.description,
        isCompleted: todo.isCompleted,
        dueDate: todo.dueDate,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
      },
      update: {
        title: todo.title,
        description: todo.description,
        isCompleted: todo.isCompleted,
        dueDate: todo.dueDate,
        updatedAt: todo.updatedAt,
      },
    });
  }

  async findPageByUserId(
    userId: string,
    filters: TodoListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedTodos> {
    const where = createTodoWhereClause(userId, filters);
    const skip = (page - 1) * limit;

    const [todoRecords, totalItems] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.todo.count({
        where,
      }),
    ]);

    return {
      items: todoRecords.map(mapTodoRecordToAggregate),
      totalItems,
    };
  }

  async findByIdAndUserId(todoId: string, userId: string): Promise<Todo | null> {
    const todoRecord = await this.prisma.todo.findFirst({
      where: {
        id: todoId,
        userId,
      },
    });

    return todoRecord ? mapTodoRecordToAggregate(todoRecord) : null;
  }

  async deleteByIdAndUserId(todoId: string, userId: string): Promise<void> {
    await this.prisma.todo.deleteMany({
      where: {
        id: todoId,
        userId,
      },
    });
  }
}

function createTodoWhereClause(userId: string, filters: TodoListFilters) {
  const trimmedSearch = filters.search?.trim();

  return {
    userId,
    ...(filters.isCompleted === undefined
      ? {}
      : {
          isCompleted: filters.isCompleted,
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
              description: {
                contains: trimmedSearch,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  };
}

function mapTodoRecordToAggregate(todoRecord: {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Todo {
  return Todo.rehydrate(
    {
      userId: todoRecord.userId,
      title: todoRecord.title,
      description: todoRecord.description,
      isCompleted: todoRecord.isCompleted,
      dueDate: todoRecord.dueDate,
      createdAt: todoRecord.createdAt,
      updatedAt: todoRecord.updatedAt,
    },
    new UniqueEntityId(todoRecord.id),
  );
}
