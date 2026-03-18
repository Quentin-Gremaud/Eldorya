import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidActionProposalException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forReason(reason: string): InvalidActionProposalException {
    return new InvalidActionProposalException(
      `Action proposal is invalid: ${reason}`,
    );
  }
}
