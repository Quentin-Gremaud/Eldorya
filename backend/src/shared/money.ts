export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    return new Money(amount, currency.toUpperCase());
  }

  static zero(currency = 'EUR'): Money {
    return new Money(0, currency.toUpperCase());
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
