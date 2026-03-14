import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class NotALocationTokenException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forToken(tokenId: string, campaignId: string): NotALocationTokenException {
    return new NotALocationTokenException(
      `Token '${tokenId}' in campaign '${campaignId}' is not a location token and cannot be linked to a destination`,
    );
  }
}
