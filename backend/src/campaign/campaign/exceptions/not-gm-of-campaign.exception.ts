import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class NotGmOfCampaignException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): NotGmOfCampaignException {
    return new NotGmOfCampaignException(
      'You are not the GM of this campaign.',
    );
  }
}
