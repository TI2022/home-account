export class Result<T> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly value?: T,
    private readonly error?: string
  ) {}

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  static failure<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  isSuccessResult(): boolean {
    return this.isSuccess;
  }

  isFailureResult(): boolean {
    return !this.isSuccess;
  }

  getValue(): T | undefined {
    return this.value;
  }

  getError(): string | undefined {
    return this.error;
  }

  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isSuccess && this.value !== undefined) {
      return Result.success(fn(this.value));
    }
    return Result.failure<U>(this.error || 'Unknown error');
  }

  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isSuccess && this.value !== undefined) {
      return fn(this.value);
    }
    return Result.failure<U>(this.error || 'Unknown error');
  }
} 