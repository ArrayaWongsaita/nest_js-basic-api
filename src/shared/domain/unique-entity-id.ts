import { randomUUID } from 'node:crypto';

export class UniqueEntityId {
  constructor(private readonly value: string = randomUUID()) {}

  toString(): string {
    return this.value;
  }

  equals(other: UniqueEntityId): boolean {
    return this.value === other.value;
  }
}
