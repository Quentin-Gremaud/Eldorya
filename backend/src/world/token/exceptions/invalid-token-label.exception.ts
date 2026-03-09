import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidTokenLabelException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidTokenLabelException {
    return new InvalidTokenLabelException('TokenLabel cannot be empty');
  }

  static tooLong(label: string): InvalidTokenLabelException {
    return new InvalidTokenLabelException(
      `TokenLabel is too long (${label.length} chars). Maximum is 100 characters.`,
    );
  }
}
