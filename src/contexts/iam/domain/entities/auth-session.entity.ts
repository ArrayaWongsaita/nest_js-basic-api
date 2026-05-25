import { Entity } from '../../../../shared/domain/entity';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

interface AuthSessionProps {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IssueAuthSessionProps {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  issuedAt: Date;
}

export class AuthSession extends Entity<AuthSessionProps> {
  private constructor(props: AuthSessionProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static issue(props: IssueAuthSessionProps): AuthSession {
    return new AuthSession({
      userId: props.userId,
      refreshTokenHash: props.refreshTokenHash,
      expiresAt: props.expiresAt,
      createdAt: props.issuedAt,
      updatedAt: props.issuedAt,
    });
  }

  static rehydrate(props: AuthSessionProps, id: UniqueEntityId): AuthSession {
    return new AuthSession(props, id);
  }

  rotate(refreshTokenHash: string, expiresAt: Date, rotatedAt: Date): void {
    this.props.refreshTokenHash = refreshTokenHash;
    this.props.expiresAt = expiresAt;
    this.props.updatedAt = rotatedAt;
  }

  isExpiredAt(date: Date): boolean {
    return this.props.expiresAt.getTime() <= date.getTime();
  }

  get userId(): string {
    return this.props.userId;
  }

  get refreshTokenHash(): string {
    return this.props.refreshTokenHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
