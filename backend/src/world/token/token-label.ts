import { InvalidTokenLabelException } from './exceptions/invalid-token-label.exception.js';

export class TokenLabel {
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly value: string) {}

  static create(label: string): TokenLabel {
    if (!label || !label.trim()) {
      throw InvalidTokenLabelException.empty();
    }
    const trimmed = label.trim();
    if (trimmed.length > TokenLabel.MAX_LENGTH) {
      throw InvalidTokenLabelException.tooLong(trimmed);
    }
    return new TokenLabel(trimmed);
  }

  static fromPrimitives(label: string): TokenLabel {
    if (!label || !label.trim()) {
      throw new Error('Corrupted event stream: TokenLabel cannot be empty');
    }
    const trimmed = label.trim();
    if (trimmed.length > TokenLabel.MAX_LENGTH) {
      throw new Error('Corrupted event stream: TokenLabel exceeds max length');
    }
    return new TokenLabel(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TokenLabel | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
