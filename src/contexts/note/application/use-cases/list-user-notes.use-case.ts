import { UseCase } from '../../../../shared/application/use-case';
import { NoteRepository } from '../../domain/repositories/note.repository';
import { CreateNoteResult } from '../dto/create-note.result';
import { ListUserNotesResult } from '../dto/list-user-notes.result';
import { ListUserNotesQuery } from '../queries/list-user-notes.query';
import { mapNoteToResult } from './create-note.use-case';

export class ListUserNotesUseCase
  implements UseCase<ListUserNotesQuery, ListUserNotesResult>
{
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(query: ListUserNotesQuery): Promise<ListUserNotesResult> {
    const paginatedNotes = await this.noteRepository.findPageByUserId(
      query.userId,
      {
        search: query.search,
      },
      query.page,
      query.limit,
    );

    return {
      userId: query.userId,
      items: paginatedNotes.items.map(mapNoteToResult),
      meta: {
        page: query.page,
        limit: query.limit,
        totalItems: paginatedNotes.totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(paginatedNotes.totalItems / query.limit),
        ),
      },
    };
  }
}
