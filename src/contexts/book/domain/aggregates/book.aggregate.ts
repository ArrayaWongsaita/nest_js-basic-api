import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

export enum BookStatus {
  TO_READ = 'TO_READ',
  READING = 'READING',
  COMPLETED = 'COMPLETED',
}

type BookProps = {
  userId: string;
  title: string;
  author: string;
  genre: string | null;
  publishedYear: number | null;
  status: BookStatus;
  createdAt: Date;
  updatedAt: Date;
};

type CreateBookProps = {
  userId: string;
  title: string;
  author: string;
  genre: string | null;
  publishedYear: number | null;
};

type UpdateBookProps = {
  title?: string;
  author?: string;
  genre?: string | null;
  publishedYear?: number | null;
  status?: BookStatus;
};

export class Book extends AggregateRoot<BookProps> {
  private constructor(props: BookProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateBookProps): Book {
    const now = new Date();

    return new Book({
      userId: props.userId,
      title: props.title,
      author: props.author,
      genre: props.genre,
      publishedYear: props.publishedYear,
      status: BookStatus.TO_READ,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: BookProps, id: UniqueEntityId): Book {
    return new Book(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get author(): string {
    return this.props.author;
  }

  get genre(): string | null {
    return this.props.genre;
  }

  get publishedYear(): number | null {
    return this.props.publishedYear;
  }

  get status(): BookStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(props: UpdateBookProps): void {
    if (props.title !== undefined) {
      this.props.title = props.title;
    }

    if (props.author !== undefined) {
      this.props.author = props.author;
    }

    if (props.genre !== undefined) {
      this.props.genre = props.genre;
    }

    if (props.publishedYear !== undefined) {
      this.props.publishedYear = props.publishedYear;
    }

    if (props.status !== undefined) {
      this.props.status = props.status;
    }

    this.props.updatedAt = new Date();
  }
}
