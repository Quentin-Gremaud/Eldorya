import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class NotActionProposerException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forPlayer(callerUserId: string): NotActionProposerException {
    return new NotActionProposerException(
      `Only the action proposer can cancel this action. User "${callerUserId}" is not the proposer`,
    );
  }
}
