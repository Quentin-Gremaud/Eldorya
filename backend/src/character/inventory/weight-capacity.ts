import { DomainException } from '../../shared/exceptions/domain.exception.js';

class InvalidWeightCapacityException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static negativeCapacity(maxCapacity: number): InvalidWeightCapacityException {
    return new InvalidWeightCapacityException(
      `Maximum weight capacity cannot be negative: ${maxCapacity}.`,
    );
  }

  static negativeWeight(currentWeight: number): InvalidWeightCapacityException {
    return new InvalidWeightCapacityException(
      `Current weight cannot be negative: ${currentWeight}.`,
    );
  }
}

export class WeightCapacity {
  private constructor(
    private readonly currentWeight: number,
    private readonly maxCapacity: number,
  ) {}

  static create(currentWeight: number, maxCapacity: number): WeightCapacity {
    if (maxCapacity < 0) {
      throw InvalidWeightCapacityException.negativeCapacity(maxCapacity);
    }
    if (currentWeight < 0) {
      throw InvalidWeightCapacityException.negativeWeight(currentWeight);
    }
    return new WeightCapacity(currentWeight, maxCapacity);
  }

  getCurrentWeight(): number {
    return this.currentWeight;
  }

  getMaxCapacity(): number {
    return this.maxCapacity;
  }

  isOverencumbered(): boolean {
    return this.currentWeight > this.maxCapacity;
  }

  withWeight(newWeight: number): WeightCapacity {
    return WeightCapacity.create(newWeight, this.maxCapacity);
  }

  equals(other: WeightCapacity): boolean {
    return (
      this.currentWeight === other.currentWeight &&
      this.maxCapacity === other.maxCapacity
    );
  }
}
