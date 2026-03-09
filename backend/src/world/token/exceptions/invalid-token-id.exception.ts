import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidTokenIdException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidTokenIdException {
    return new InvalidTokenIdException('TokenId cannot be empty');
  }

  static invalidFormat(id: string): InvalidTokenIdException {
    return new InvalidTokenIdException(
      `Invalid TokenId format: '${id}'. Must be a valid UUID.`,
    );
  }
}
