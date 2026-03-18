import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidQueueReorderException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static forMismatchedActionIds(): InvalidQueueReorderException {
    return new InvalidQueueReorderException(
      'Cannot reorder queue: provided action IDs do not match current pending actions',
    );
  }

  static forEmptyQueue(): InvalidQueueReorderException {
    return new InvalidQueueReorderException(
      'Cannot reorder queue: no pending actions to reorder',
    );
  }
}
