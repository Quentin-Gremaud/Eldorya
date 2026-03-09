import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvitationNotFoundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static notFound(): InvitationNotFoundException {
    return new InvitationNotFoundException('Invitation not found.');
  }

  static withId(invitationId: string): InvitationNotFoundException {
    return new InvitationNotFoundException(
      `Invitation with id "${invitationId}" was not found.`,
    );
  }
}
