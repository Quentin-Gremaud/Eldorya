import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidCharacterNameException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(name: string): InvalidCharacterNameException {
    return new InvalidCharacterNameException(
      `Invalid character name: '${name}'. Must be 1-50 characters.`,
    );
  }
}
