import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class FogZoneNotFoundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forZone(fogZoneId: string, campaignId: string, playerId: string): FogZoneNotFoundException {
    return new FogZoneNotFoundException(
      `Fog zone '${fogZoneId}' not found for player '${playerId}' in campaign '${campaignId}'.`,
    );
  }
}
