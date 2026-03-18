import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class ActionNotPendingException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forAction(actionId: string): ActionNotPendingException {
    return new ActionNotPendingException(
      `Cannot validate/reject action: action "${actionId}" is not in pending status`,
    );
  }
}
