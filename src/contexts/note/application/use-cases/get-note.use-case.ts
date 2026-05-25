import { Result } from '../../../../shared/application/result';
import { UseCase } from '../../../../shared/application/use-case';
import { NoteRepository } from '../../domain/repositories/note.repository';
import { CreateNoteResult } from '../dto/create-note.result';
import { GetNoteQuery } from '../queries/get-note.query';
import { mapNoteToResult } from './create-note.use-case';

export class GetNoteUseCase
  implements UseCase<GetNoteQuery, Result<CreateNoteResult, string>>
{
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(
    query: GetNoteQuery,
  ): Promise<Result<CreateNoteResult, string>> {
    const note = await this.noteRepository.findByIdAndUserId(
      query.noteId,
      query.userId,
    );

    if (!note) {
      return Result.failure('Note item was not found.');
    }

    return Result.success(mapNoteToResult(note));
  }
}
