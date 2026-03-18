import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class FeedbackRequiredException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): FeedbackRequiredException {
    return new FeedbackRequiredException(
      'Feedback is required when rejecting an action',
    );
  }
}
