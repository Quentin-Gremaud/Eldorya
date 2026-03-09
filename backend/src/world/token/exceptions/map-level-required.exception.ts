import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class MapLevelRequiredException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forToken(campaignId: string): MapLevelRequiredException {
    return new MapLevelRequiredException(
      `A map level is required to place a token in campaign '${campaignId}'`,
    );
  }
}
