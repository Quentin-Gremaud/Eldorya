import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvitationAlreadyUsedException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): InvitationAlreadyUsedException {
    return new InvitationAlreadyUsedException(
      'This invitation has already been used.',
    );
  }
}
