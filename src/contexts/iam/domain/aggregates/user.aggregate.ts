import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';
import { RoleName } from '../value-objects/role-name';
import { UserEmailAddress } from '../value-objects/user-email-address';
import { UserRegisteredDomainEvent } from '../events/user-registered.domain-event';

interface UserProps {
  email: UserEmailAddress;
  passwordHash: string;
  roles: RoleName[];
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
}

interface RegisterUserProps {
  email: UserEmailAddress;
  passwordHash: string;
  roles: RoleName[];
  isActive?: boolean;
  isSystem?: boolean;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static register(props: RegisterUserProps): User {
    const user = new User({
      ...props,
      isActive: props.isActive ?? true,
      isSystem: props.isSystem ?? false,
      createdAt: new Date(),
    });

    user.addDomainEvent(new UserRegisteredDomainEvent(user.id));

    return user;
  }

  static rehydrate(props: UserProps, id: UniqueEntityId): User {
    return new User(props, id);
  }

  get email(): UserEmailAddress {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get roleNames(): RoleName[] {
    return [...this.props.roles];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  assignRoles(roles: RoleName[]): void {
    this.props.roles = [...roles];
  }

  setActive(isActive: boolean): void {
    this.props.isActive = isActive;
  }
}
