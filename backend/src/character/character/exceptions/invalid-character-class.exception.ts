import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidCharacterClassException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(characterClass: string): InvalidCharacterClassException {
    return new InvalidCharacterClassException(
      `Invalid character class: '${characterClass}'.`,
    );
  }
}
