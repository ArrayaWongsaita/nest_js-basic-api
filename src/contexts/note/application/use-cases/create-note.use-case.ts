import { UseCase } from '../../../../shared/application/use-case';
import { Note } from '../../domain/aggregates/note.aggregate';
import { NoteRepository } from '../../domain/repositories/note.repository';
import { CreateNoteCommand } from '../commands/create-note.command';
import { CreateNoteResult } from '../dto/create-note.result';

export class CreateNoteUseCase
  implements UseCase<CreateNoteCommand, CreateNoteResult>
{
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(command: CreateNoteCommand): Promise<CreateNoteResult> {
    const note = Note.create({
      userId: command.userId,
      title: command.title,
      content: command.content,
    });

    await this.noteRepository.save(note);

    return mapNoteToResult(note);
  }
}

export function mapNoteToResult(note: Note): CreateNoteResult {
  return {
    id: note.id.toString(),
    userId: note.userId,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
