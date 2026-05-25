export class UpdateContactCommand {
  constructor(
    public readonly userId: string,
    public readonly contactId: string,
    public readonly firstName?: string,
    public readonly lastName?: string | null,
    public readonly email?: string | null,
    public readonly phone?: string | null,
    public readonly company?: string | null,
    public readonly address?: string | null,
  ) {}
}
