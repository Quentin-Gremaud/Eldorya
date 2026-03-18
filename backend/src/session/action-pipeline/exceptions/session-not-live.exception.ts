import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class SessionNotLiveException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forSession(sessionId: string): SessionNotLiveException {
    return new SessionNotLiveException(
      `Cannot perform action: session "${sessionId}" is not in live mode`,
    );
  }
}
