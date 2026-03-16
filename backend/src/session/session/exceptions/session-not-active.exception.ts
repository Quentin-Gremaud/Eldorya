import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class SessionNotActiveException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forSession(sessionId: string): SessionNotActiveException {
    return new SessionNotActiveException(
      `Session "${sessionId}" is not active`,
    );
  }
}
