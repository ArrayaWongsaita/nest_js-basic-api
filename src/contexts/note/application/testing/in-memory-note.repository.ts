import { Note } from '../../domain/aggregates/note.aggregate';
import {
  NoteListFilters,
  NoteRepository,
  PaginatedNotes,
} from '../../domain/repositories/note.repository';

/** In-memory NoteRepository for specs and e2e tests. */
export class InMemoryNoteRepository implements NoteRepository {
  private readonly notes = new Map<string, Note>();

  save(note: Note): Promise<void> {
    this.notes.set(note.id.toString(), note);

    return Promise.resolve();
  }

  findPageByUserId(
    userId: string,
    filters: NoteListFilters,
    page: number,
    limit: number,
  ): Promise<PaginatedNotes> {
    const search = filters.search?.trim().toLowerCase();
    const matching = [...this.notes.values()]
      .filter((e) => e.userId === userId)
      .filter(
        (e) =>
          !search ||
          [e.title, e.content].some((text) =>
            text.toLowerCase().includes(search),
          ),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve({
      items: matching.slice((page - 1) * limit, page * limit),
      totalItems: matching.length,
    });
  }

  findByIdAndUserId(noteId: string, userId: string): Promise<Note | null> {
    const note = this.notes.get(noteId);

    return Promise.resolve(note && note.userId === userId ? note : null);
  }

  deleteByIdAndUserId(noteId: string, userId: string): Promise<void> {
    if (this.notes.get(noteId)?.userId === userId) {
      this.notes.delete(noteId);
    }

    return Promise.resolve();
  }
}
