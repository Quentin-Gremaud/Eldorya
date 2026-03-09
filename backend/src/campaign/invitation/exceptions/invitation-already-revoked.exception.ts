import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvitationAlreadyRevokedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forInvitation(id: string): InvitationAlreadyRevokedException {
    return new InvitationAlreadyRevokedException(
      `Invitation "${id}" has already been revoked.`,
    );
  }
}
