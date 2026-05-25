export interface DomainEvent {
  readonly occurredAt: Date;
  getAggregateId(): string;
}
