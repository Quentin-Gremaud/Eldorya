import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidCharacterStatusException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static unknownValue(value: string): InvalidCharacterStatusException {
    return new InvalidCharacterStatusException(
      `Unknown character status: "${value}". Allowed values: pending, approved, rejected, pending-revalidation.`,
    );
  }
}

export class CharacterStatus {
  private static readonly PENDING_VALUE = 'pending';
  private static readonly APPROVED_VALUE = 'approved';
  private static readonly REJECTED_VALUE = 'rejected';
  private static readonly PENDING_REVALIDATION_VALUE = 'pending-revalidation';

  private static readonly ALLOWED_VALUES = [
    CharacterStatus.PENDING_VALUE,
    CharacterStatus.APPROVED_VALUE,
    CharacterStatus.REJECTED_VALUE,
    CharacterStatus.PENDING_REVALIDATION_VALUE,
  ];

  private constructor(private readonly value: string) {}

  static pending(): CharacterStatus {
    return new CharacterStatus(CharacterStatus.PENDING_VALUE);
  }

  static approved(): CharacterStatus {
    return new CharacterStatus(CharacterStatus.APPROVED_VALUE);
  }

  static rejected(): CharacterStatus {
    return new CharacterStatus(CharacterStatus.REJECTED_VALUE);
  }

  static pendingRevalidation(): CharacterStatus {
    return new CharacterStatus(CharacterStatus.PENDING_REVALIDATION_VALUE);
  }

  static fromString(value: string): CharacterStatus {
    if (!CharacterStatus.ALLOWED_VALUES.includes(value)) {
      throw InvalidCharacterStatusException.unknownValue(value);
    }
    return new CharacterStatus(value);
  }

  isPending(): boolean {
    return this.value === CharacterStatus.PENDING_VALUE;
  }

  isApproved(): boolean {
    return this.value === CharacterStatus.APPROVED_VALUE;
  }

  isRejected(): boolean {
    return this.value === CharacterStatus.REJECTED_VALUE;
  }

  isPendingRevalidation(): boolean {
    return this.value === CharacterStatus.PENDING_REVALIDATION_VALUE;
  }

  toString(): string {
    return this.value;
  }

  equals(other: CharacterStatus | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
