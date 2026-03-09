import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class AlreadyCampaignMemberException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): AlreadyCampaignMemberException {
    return new AlreadyCampaignMemberException(
      'You are already a member of this campaign.',
    );
  }
}
