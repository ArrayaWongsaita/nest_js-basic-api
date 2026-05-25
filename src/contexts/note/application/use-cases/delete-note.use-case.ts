import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { NoteRepository } from '../../domain/repositories/note.repository';
import { DeleteNoteCommand } from '../commands/delete-note.command';

export class DeleteNoteUseCase
  implements UseCase<DeleteNoteCommand, Result<void, string>>
{
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(command: DeleteNoteCommand): Promise<Result<void, string>> {
    const note = await this.noteRepository.findByIdAndUserId(
      command.noteId,
      command.userId,
    );

    if (!note) {
      return Result.failure('Note item was not found.');
    }

    await this.noteRepository.deleteByIdAndUserId(command.noteId, command.userId);

    return Result.success(undefined);
  }
}
