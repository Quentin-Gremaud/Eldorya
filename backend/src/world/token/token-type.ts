import { InvalidTokenTypeException } from './exceptions/invalid-token-type.exception.js';

const ALLOWED_TYPES = ['player', 'npc', 'monster', 'location'] as const;
export type TokenTypeValue = (typeof ALLOWED_TYPES)[number];

export class TokenType {
  private constructor(private readonly value: TokenTypeValue) {}

  static fromString(type: string): TokenType {
    if (!type || !type.trim()) {
      throw InvalidTokenTypeException.empty();
    }
    const trimmed = type.trim().toLowerCase();
    if (!(ALLOWED_TYPES as readonly string[]).includes(trimmed)) {
      throw InvalidTokenTypeException.invalidValue(type);
    }
    return new TokenType(trimmed as TokenTypeValue);
  }

  static fromPrimitives(type: string): TokenType {
    const trimmed = type.trim().toLowerCase();
    if (!(ALLOWED_TYPES as readonly string[]).includes(trimmed)) {
      throw new Error(`Corrupted event stream: invalid token type "${type}"`);
    }
    return new TokenType(trimmed as TokenTypeValue);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TokenType | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
