import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class NotSessionGmException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forUser(userId: string): NotSessionGmException {
    return new NotSessionGmException(
      `Only the session GM can ping players. User "${userId}" is not the GM`,
    );
  }
}
