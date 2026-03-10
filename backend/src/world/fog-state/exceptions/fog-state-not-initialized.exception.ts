import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class FogStateNotInitializedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forPlayer(campaignId: string, playerId: string): FogStateNotInitializedException {
    return new FogStateNotInitializedException(
      `Fog state not initialized for player '${playerId}' in campaign '${campaignId}'.`,
    );
  }
}
