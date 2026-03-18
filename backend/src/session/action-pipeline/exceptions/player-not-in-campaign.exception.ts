import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class PlayerNotInCampaignException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forPlayer(playerId: string, campaignId: string): PlayerNotInCampaignException {
    return new PlayerNotInCampaignException(
      `Player "${playerId}" is not a member of campaign "${campaignId}"`,
    );
  }
}
