import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidMapLevelIdException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidMapLevelIdException {
    return new InvalidMapLevelIdException('MapLevelId cannot be empty');
  }

  static invalidFormat(id: string): InvalidMapLevelIdException {
    return new InvalidMapLevelIdException(
      `Invalid MapLevelId format: '${id}'. Must be a valid UUID.`,
    );
  }
}
