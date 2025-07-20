export class Money {
  constructor(private readonly amount: number) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }

  static create(amount: number): Money {
    return new Money(amount);
  }

  getValue(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Cannot subtract more than available amount');
    }
    return new Money(result);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this.amount / divisor);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  toString(): string {
    return this.amount.toString();
  }

  format(): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(this.amount);
  }
} 