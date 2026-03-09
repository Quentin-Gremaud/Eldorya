import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class MaxMapDepthReachedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forCampaign(campaignId: string): MaxMapDepthReachedException {
    return new MaxMapDepthReachedException(
      `Maximum nesting depth of 10 levels reached for campaign '${campaignId}'.`,
    );
  }
}
