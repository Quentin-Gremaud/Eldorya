import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidMapLevelNameException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidMapLevelNameException {
    return new InvalidMapLevelNameException(
      'Map level name cannot be empty.',
    );
  }

  static tooLong(name: string): InvalidMapLevelNameException {
    return new InvalidMapLevelNameException(
      `Map level name '${name}' exceeds maximum length of 100 characters.`,
    );
  }
}
