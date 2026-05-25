import { CreateNoteResult } from '../../../application/dto/create-note.result';
import { ListUserNotesResult } from '../../../application/dto/list-user-notes.result';
import { NoteListPaginationMetaDto } from '../dto/note-list-pagination-meta.dto';
import { ListUserNotesResponseDto } from '../dto/list-user-notes-response.dto';
import { NoteResponseDto } from '../dto/note-response.dto';

export class NotePresenter {
  static toNoteResponse(result: CreateNoteResult): NoteResponseDto {
    return {
      id: result.id,
      userId: result.userId,
      title: result.title,
      content: result.content,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  static toUserNoteListResponse(
    result: ListUserNotesResult,
  ): ListUserNotesResponseDto {
    return {
      userId: result.userId,
      items: result.items.map((item) => this.toNoteResponse(item)),
    };
  }

  static toNoteListPaginationMeta(
    result: ListUserNotesResult,
  ): NoteListPaginationMetaDto {
    return {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.totalItems,
      totalPages: result.meta.totalPages,
    };
  }
}
