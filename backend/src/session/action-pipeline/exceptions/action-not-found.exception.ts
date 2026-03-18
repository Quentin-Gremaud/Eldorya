import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class ActionNotFoundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forAction(actionId: string): ActionNotFoundException {
    return new ActionNotFoundException(
      `Action "${actionId}" not found in this session`,
    );
  }
}
