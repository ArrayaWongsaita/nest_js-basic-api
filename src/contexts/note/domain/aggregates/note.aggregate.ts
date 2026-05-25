import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

type NoteProps = {
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreateNoteProps = {
  userId: string;
  title: string;
  content: string;
};

type UpdateNoteProps = {
  title?: string;
  content?: string;
};

export class Note extends AggregateRoot<NoteProps> {
  private constructor(props: NoteProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateNoteProps): Note {
    const now = new Date();

    return new Note({
      userId: props.userId,
      title: props.title,
      content: props.content,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: NoteProps, id: UniqueEntityId): Note {
    return new Note(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(props: UpdateNoteProps): void {
    if (props.title !== undefined) {
      this.props.title = props.title;
    }

    if (props.content !== undefined) {
      this.props.content = props.content;
    }

    this.props.updatedAt = new Date();
  }
}
