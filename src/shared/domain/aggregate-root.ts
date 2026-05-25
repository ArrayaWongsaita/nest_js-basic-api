import { DomainEvent } from './domain-event';
import { Entity } from './entity';
import { UniqueEntityId } from './unique-entity-id';

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private readonly domainEvents: DomainEvent[] = [];

  protected constructor(props: TProps, id?: UniqueEntityId) {
    super(props, id);
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this.domainEvents.push(domainEvent);
  }

  pullDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }
}
