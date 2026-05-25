export interface CreateNoteResult {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
