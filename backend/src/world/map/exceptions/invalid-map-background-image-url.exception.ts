import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidMapBackgroundImageUrlException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidMapBackgroundImageUrlException {
    return new InvalidMapBackgroundImageUrlException(
      'Background image URL cannot be empty.',
    );
  }

  static tooLong(url: string): InvalidMapBackgroundImageUrlException {
    return new InvalidMapBackgroundImageUrlException(
      `Background image URL exceeds maximum length of 2048 characters (got ${url.length}).`,
    );
  }
}
