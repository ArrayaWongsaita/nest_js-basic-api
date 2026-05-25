export class GetContactQuery {
  constructor(
    public readonly userId: string,
    public readonly contactId: string,
  ) {}
}
