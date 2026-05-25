export class LogoutAuthSessionCommand {
  constructor(public readonly refreshToken: string | null) {}
}
