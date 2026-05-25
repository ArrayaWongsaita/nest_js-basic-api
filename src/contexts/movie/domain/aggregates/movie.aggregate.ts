import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

export enum MovieStatus {
  TO_WATCH = 'TO_WATCH',
  WATCHING = 'WATCHING',
  WATCHED = 'WATCHED',
}

type MovieProps = {
  userId: string;
  title: string;
  director: string | null;
  genre: string | null;
  releaseYear: number | null;
  status: MovieStatus;
  createdAt: Date;
  updatedAt: Date;
};

type CreateMovieProps = {
  userId: string;
  title: string;
  director: string | null;
  genre: string | null;
  releaseYear: number | null;
};

type UpdateMovieProps = {
  title?: string;
  director?: string | null;
  genre?: string | null;
  releaseYear?: number | null;
  status?: MovieStatus;
};

export class Movie extends AggregateRoot<MovieProps> {
  private constructor(props: MovieProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateMovieProps): Movie {
    const now = new Date();

    return new Movie({
      userId: props.userId,
      title: props.title,
      director: props.director,
      genre: props.genre,
      releaseYear: props.releaseYear,
      status: MovieStatus.TO_WATCH,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: MovieProps, id: UniqueEntityId): Movie {
    return new Movie(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get director(): string | null {
    return this.props.director;
  }

  get genre(): string | null {
    return this.props.genre;
  }

  get releaseYear(): number | null {
    return this.props.releaseYear;
  }

  get status(): MovieStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(props: UpdateMovieProps): void {
    if (props.title !== undefined) {
      this.props.title = props.title;
    }

    if (props.director !== undefined) {
      this.props.director = props.director;
    }

    if (props.genre !== undefined) {
      this.props.genre = props.genre;
    }

    if (props.releaseYear !== undefined) {
      this.props.releaseYear = props.releaseYear;
    }

    if (props.status !== undefined) {
      this.props.status = props.status;
    }

    this.props.updatedAt = new Date();
  }
}
