import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class DestinationRequiredForLocationTokenException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forToken(campaignId: string): DestinationRequiredForLocationTokenException {
    return new DestinationRequiredForLocationTokenException(
      `A destination map level is required for location tokens in campaign '${campaignId}'`,
    );
  }
}
