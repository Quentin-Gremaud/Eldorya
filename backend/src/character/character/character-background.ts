import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidCharacterBackgroundException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static empty(): InvalidCharacterBackgroundException {
    return new InvalidCharacterBackgroundException(
      'Character background cannot be empty.',
    );
  }

  static tooLong(maxLength: number): InvalidCharacterBackgroundException {
    return new InvalidCharacterBackgroundException(
      `Character background cannot exceed ${maxLength} characters.`,
    );
  }
}

export class CharacterBackground {
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly value: string) {}

  static fromString(background: string): CharacterBackground {
    if (!background || !background.trim()) {
      throw InvalidCharacterBackgroundException.empty();
    }
    const trimmed = background.trim();
    if (trimmed.length > CharacterBackground.MAX_LENGTH) {
      throw InvalidCharacterBackgroundException.tooLong(
        CharacterBackground.MAX_LENGTH,
      );
    }
    return new CharacterBackground(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CharacterBackground | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
