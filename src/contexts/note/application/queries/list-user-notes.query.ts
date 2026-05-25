export class ListUserNotesQuery {
  constructor(
    public readonly userId: string,
    public readonly search: string | undefined,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
