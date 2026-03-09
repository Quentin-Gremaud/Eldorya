import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CampaignLimitReachedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forFreeTier(limit: number): CampaignLimitReachedException {
    return new CampaignLimitReachedException(
      `Free-tier users are limited to ${limit} active campaigns. Archive an existing campaign or upgrade to Pro.`,
    );
  }
}
