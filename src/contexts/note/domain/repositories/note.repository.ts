import { Note } from '../aggregates/note.aggregate';

export interface NoteListFilters {
  readonly search?: string;
}

export interface PaginatedNotes {
  readonly items: Note[];
  readonly totalItems: number;
}

export interface NoteRepository {
  save(note: Note): Promise<void>;
  findPageByUserId(
    userId: string,
    filters: NoteListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedNotes>;
  findByIdAndUserId(noteId: string, userId: string): Promise<Note | null>;
  deleteByIdAndUserId(noteId: string, userId: string): Promise<void>;
}
