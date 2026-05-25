import { DomainEvent } from '../../../../shared/domain/domain-event';
import { UniqueEntityId } from '../../../../shared/domain/unique-entity-id';

export class UserRegisteredDomainEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(private readonly userId: UniqueEntityId) {}

  getAggregateId(): string {
    return this.userId.toString();
  }
}
