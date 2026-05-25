import { CreateNoteResult } from './create-note.result';

export interface NoteListPaginationResult {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ListUserNotesResult {
  readonly userId: string;
  readonly items: CreateNoteResult[];
  readonly meta: NoteListPaginationResult;
}
