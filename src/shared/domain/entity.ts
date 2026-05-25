import { UniqueEntityId } from './unique-entity-id';

export abstract class Entity<TProps> {
  readonly id: UniqueEntityId;
  protected readonly props: TProps;

  protected constructor(props: TProps, id?: UniqueEntityId) {
    this.id = id ?? new UniqueEntityId();
    this.props = props;
  }

  equals(entity?: Entity<TProps>): boolean {
    if (!entity) {
      return false;
    }

    return this.id.equals(entity.id);
  }
}
