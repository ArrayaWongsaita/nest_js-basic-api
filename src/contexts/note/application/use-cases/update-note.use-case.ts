import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { NoteRepository } from '../../domain/repositories/note.repository';
import { CreateNoteResult } from '../dto/create-note.result';
import { UpdateNoteCommand } from '../commands/update-note.command';
import { mapNoteToResult } from './create-note.use-case';

export class UpdateNoteUseCase
  implements UseCase<UpdateNoteCommand, Result<CreateNoteResult, string>>
{
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(
    command: UpdateNoteCommand,
  ): Promise<Result<CreateNoteResult, string>> {
    const note = await this.noteRepository.findByIdAndUserId(
      command.noteId,
      command.userId,
    );

    if (!note) {
      return Result.failure('Note item was not found.');
    }

    note.update({
      title: command.title,
      content: command.content,
    });

    await this.noteRepository.save(note);

    return Result.success(mapNoteToResult(note));
  }
}
