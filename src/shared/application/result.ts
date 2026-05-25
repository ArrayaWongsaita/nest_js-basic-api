export class Result<TValue, TError = string> {
  private constructor(
    public readonly ok: boolean,
    private readonly internalValue: TValue | null,
    private readonly internalError: TError | null,
  ) {}

  static success<TValue>(value: TValue): Result<TValue> {
    return new Result<TValue>(true, value, null);
  }

  static failure<TError>(error: TError): Result<never, TError> {
    return new Result<never, TError>(false, null, error);
  }

  get value(): TValue {
    if (!this.ok || this.internalValue === null) {
      throw new Error('Cannot read the value of a failed result.');
    }

    return this.internalValue;
  }

  get error(): TError {
    if (this.ok || this.internalError === null) {
      throw new Error('Cannot read the error of a successful result.');
    }

    return this.internalError;
  }
}
