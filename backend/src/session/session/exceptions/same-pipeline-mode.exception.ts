import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class SamePipelineModeException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forMode(mode: string): SamePipelineModeException {
    return new SamePipelineModeException(
      `Pipeline mode is already set to ${mode}`,
    );
  }
}
