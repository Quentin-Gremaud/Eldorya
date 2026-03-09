import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class TokenNotFoundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forToken(tokenId: string, campaignId: string): TokenNotFoundException {
    return new TokenNotFoundException(
      `Token '${tokenId}' not found in campaign '${campaignId}'`,
    );
  }
}
