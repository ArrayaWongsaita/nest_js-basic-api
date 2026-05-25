import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

type TodoProps = {
  userId: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateTodoProps = {
  userId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
};

type UpdateTodoProps = {
  title?: string;
  description?: string | null;
  isCompleted?: boolean;
  dueDate?: Date | null;
};

export class Todo extends AggregateRoot<TodoProps> {
  private constructor(props: TodoProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateTodoProps): Todo {
    const now = new Date();

    return new Todo({
      userId: props.userId,
      title: props.title,
      description: props.description,
      isCompleted: false,
      dueDate: props.dueDate,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: TodoProps, id: UniqueEntityId): Todo {
    return new Todo(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get isCompleted(): boolean {
    return this.props.isCompleted;
  }

  get dueDate(): Date | null {
    return this.props.dueDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(props: UpdateTodoProps): void {
    if (props.title !== undefined) {
      this.props.title = props.title;
    }

    if (props.description !== undefined) {
      this.props.description = props.description;
    }

    if (props.isCompleted !== undefined) {
      this.props.isCompleted = props.isCompleted;
    }

    if (props.dueDate !== undefined) {
      this.props.dueDate = props.dueDate;
    }

    this.props.updatedAt = new Date();
  }
}
