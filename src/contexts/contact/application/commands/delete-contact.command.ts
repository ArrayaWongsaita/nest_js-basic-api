export class DeleteContactCommand {
  constructor(
    public readonly userId: string,
    public readonly contactId: string,
  ) {}
}
