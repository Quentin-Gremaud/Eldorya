import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CampaignNotActiveException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): CampaignNotActiveException {
    return new CampaignNotActiveException(
      'Cannot perform this action on a campaign that is not active.',
    );
  }
}
