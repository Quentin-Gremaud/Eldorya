import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidCharacterStatsException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(detail: string): InvalidCharacterStatsException {
    return new InvalidCharacterStatsException(
      `Invalid character stats: ${detail}`,
    );
  }
}
