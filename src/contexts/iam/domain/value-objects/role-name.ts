import { ValueObject } from '../../../../shared/domain/value-object';

interface RoleNameProps {
  value: string;
}

export class RoleName extends ValueObject<RoleNameProps> {
  private constructor(props: RoleNameProps) {
    super(props);
  }

  static create(value: string): RoleName {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      throw new Error('Role name cannot be empty.');
    }

    return new RoleName({ value: normalizedValue });
  }

  toString(): string {
    return this.props.value;
  }
}
