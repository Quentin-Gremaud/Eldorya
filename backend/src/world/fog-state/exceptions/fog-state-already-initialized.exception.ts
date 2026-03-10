import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class FogStateAlreadyInitializedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forPlayer(campaignId: string, playerId: string): FogStateAlreadyInitializedException {
    return new FogStateAlreadyInitializedException(
      `Fog state already initialized for player '${playerId}' in campaign '${campaignId}'.`,
    );
  }
}
