import { ValueObject } from '../../../../shared/domain/value-object';

interface PermissionNameProps {
  value: string;
}

export class PermissionName extends ValueObject<PermissionNameProps> {
  private constructor(props: PermissionNameProps) {
    super(props);
  }

  static create(value: string): PermissionName {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      throw new Error('Permission name cannot be empty.');
    }

    return new PermissionName({ value: normalizedValue });
  }

  toString(): string {
    return this.props.value;
  }
}
