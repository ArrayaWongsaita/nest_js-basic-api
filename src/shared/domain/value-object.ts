export abstract class ValueObject<TProps> {
  protected constructor(protected readonly props: TProps) {}

  equals(valueObject?: ValueObject<TProps>): boolean {
    if (!valueObject) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(valueObject.props);
  }
}
