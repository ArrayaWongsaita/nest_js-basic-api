import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

type ContactProps = {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateContactProps = {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
};

type UpdateContactProps = {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
};

export class Contact extends AggregateRoot<ContactProps> {
  private constructor(props: ContactProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(props: CreateContactProps): Contact {
    const now = new Date();

    return new Contact(
      {
        userId: props.userId,
        firstName: props.firstName,
        lastName: props.lastName,
        email: props.email,
        phone: props.phone,
        company: props.company,
        address: props.address,
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  static rehydrate(props: ContactProps, id: UniqueEntityId): Contact {
    return new Contact(props, id);
  }

  get userId(): string {
    return this.props.userId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string | null {
    return this.props.lastName;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get company(): string | null {
    return this.props.company;
  }

  get address(): string | null {
    return this.props.address;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(props: UpdateContactProps): void {
    if (props.firstName !== undefined) {
      this.props.firstName = props.firstName;
    }

    if (props.lastName !== undefined) {
      this.props.lastName = props.lastName;
    }

    if (props.email !== undefined) {
      this.props.email = props.email;
    }

    if (props.phone !== undefined) {
      this.props.phone = props.phone;
    }

    if (props.company !== undefined) {
      this.props.company = props.company;
    }

    if (props.address !== undefined) {
      this.props.address = props.address;
    }

    this.props.updatedAt = new Date();
  }
}
