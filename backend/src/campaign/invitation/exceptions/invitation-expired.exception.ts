import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvitationExpiredException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): InvitationExpiredException {
    return new InvitationExpiredException('This invitation has expired.');
  }
}
