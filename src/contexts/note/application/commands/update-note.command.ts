export class UpdateNoteCommand {
  constructor(
    public readonly userId: string,
    public readonly noteId: string,
    public readonly title?: string,
    public readonly content?: string,
  ) {}
}
