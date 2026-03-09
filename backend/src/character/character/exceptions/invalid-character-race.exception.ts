import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidCharacterRaceException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(race: string): InvalidCharacterRaceException {
    return new InvalidCharacterRaceException(
      `Invalid character race: '${race}'.`,
    );
  }
}
