import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class CampaignNotArchivedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): CampaignNotArchivedException {
    return new CampaignNotArchivedException(
      'Cannot reactivate a campaign that is not archived.',
    );
  }
}
