import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidTokenPositionException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static invalidX(x: number): InvalidTokenPositionException {
    return new InvalidTokenPositionException(
      `Invalid token position x: ${x}. Must be a non-negative integer.`,
    );
  }

  static invalidY(y: number): InvalidTokenPositionException {
    return new InvalidTokenPositionException(
      `Invalid token position y: ${y}. Must be a non-negative integer.`,
    );
  }
}
