import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class SameModeTransitionException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forMode(mode: string): SameModeTransitionException {
    return new SameModeTransitionException(
      `Session is already in ${mode} mode`,
    );
  }
}
