import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class ProSubscriptionRequiredException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static create(): ProSubscriptionRequiredException {
    return new ProSubscriptionRequiredException(
      'A Pro subscription is required to reactivate an archived campaign.',
    );
  }
}
