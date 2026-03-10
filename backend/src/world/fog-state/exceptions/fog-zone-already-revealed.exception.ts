import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class FogZoneAlreadyRevealedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forZone(fogZoneId: string, campaignId: string, playerId: string): FogZoneAlreadyRevealedException {
    return new FogZoneAlreadyRevealedException(
      `Fog zone '${fogZoneId}' is already revealed for player '${playerId}' in campaign '${campaignId}'.`,
    );
  }
}
