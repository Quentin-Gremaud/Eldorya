import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class TokenAlreadyExistsException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forToken(tokenId: string, campaignId: string): TokenAlreadyExistsException {
    return new TokenAlreadyExistsException(
      `Token '${tokenId}' already exists in campaign '${campaignId}'`,
    );
  }
}
