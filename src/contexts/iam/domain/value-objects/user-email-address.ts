import { ValueObject } from '../../../../shared/domain/value-object';

interface UserEmailAddressProps {
  value: string;
}

export class UserEmailAddress extends ValueObject<UserEmailAddressProps> {
  private constructor(props: UserEmailAddressProps) {
    super(props);
  }

  static create(value: string): UserEmailAddress {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue.includes('@')) {
      throw new Error('Email address must contain "@".');
    }

    return new UserEmailAddress({ value: normalizedValue });
  }

  toString(): string {
    return this.props.value;
  }
}
