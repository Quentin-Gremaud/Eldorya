import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidMapLevelDepthException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static notInteger(depth: number): InvalidMapLevelDepthException {
    return new InvalidMapLevelDepthException(
      `Map level depth must be an integer, got ${depth}.`,
    );
  }

  static outOfRange(depth: number): InvalidMapLevelDepthException {
    return new InvalidMapLevelDepthException(
      `Map level depth ${depth} is out of valid range (0-9).`,
    );
  }
}
