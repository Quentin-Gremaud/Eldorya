import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidRejectionReasonException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidRejectionReasonException {
    return new InvalidRejectionReasonException(
      'Rejection reason cannot be empty.',
    );
  }

  static tooLong(): InvalidRejectionReasonException {
    return new InvalidRejectionReasonException(
      'Rejection reason must be at most 500 characters.',
    );
  }
}

export class RejectionReason {
  private static readonly MAX_LENGTH = 500;

  private constructor(private readonly value: string) {}

  static fromString(reason: string): RejectionReason {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      throw InvalidRejectionReasonException.empty();
    }
    if (trimmed.length > RejectionReason.MAX_LENGTH) {
      throw InvalidRejectionReasonException.tooLong();
    }
    return new RejectionReason(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: RejectionReason | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
