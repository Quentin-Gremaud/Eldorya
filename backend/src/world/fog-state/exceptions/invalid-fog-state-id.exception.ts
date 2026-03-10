import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidFogStateIdException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static invalidCampaignId(campaignId: string): InvalidFogStateIdException {
    return new InvalidFogStateIdException(
      `Invalid FogStateId campaignId: '${campaignId}'. Must be a valid UUID.`,
    );
  }

  static invalidPlayerId(playerId: string): InvalidFogStateIdException {
    return new InvalidFogStateIdException(
      `Invalid FogStateId playerId: '${playerId}'. Must be a valid UUID.`,
    );
  }

  static invalidFormat(value: string): InvalidFogStateIdException {
    return new InvalidFogStateIdException(
      `Invalid FogStateId format: '${value}'. Expected format: {campaignId}-{playerId} with valid UUIDs.`,
    );
  }
}
