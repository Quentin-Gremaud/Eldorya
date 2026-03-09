import { InvalidTokenIdException } from './exceptions/invalid-token-id.exception.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TokenId {
  private constructor(private readonly value: string) {}

  static fromString(id: string): TokenId {
    if (!id || !id.trim()) {
      throw InvalidTokenIdException.empty();
    }
    const trimmed = id.trim();
    if (!UUID_REGEX.test(trimmed)) {
      throw InvalidTokenIdException.invalidFormat(trimmed);
    }
    return new TokenId(trimmed);
  }

  static fromPrimitives(id: string): TokenId {
    if (!UUID_REGEX.test(id)) {
      throw new Error(`Corrupted event stream: invalid token ID "${id}"`);
    }
    return new TokenId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TokenId | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
