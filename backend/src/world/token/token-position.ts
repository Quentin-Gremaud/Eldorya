import { InvalidTokenPositionException } from './exceptions/invalid-token-position.exception.js';

export class TokenPosition {
  private constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  static create(x: number, y: number): TokenPosition {
    if (!Number.isInteger(x) || x < 0) {
      throw InvalidTokenPositionException.invalidX(x);
    }
    if (!Number.isInteger(y) || y < 0) {
      throw InvalidTokenPositionException.invalidY(y);
    }
    return new TokenPosition(x, y);
  }

  static fromPrimitives(x: number, y: number): TokenPosition {
    if (!Number.isInteger(x) || x < 0) {
      throw new Error(`Corrupted event stream: TokenPosition x must be a non-negative integer, got ${x}`);
    }
    if (!Number.isInteger(y) || y < 0) {
      throw new Error(`Corrupted event stream: TokenPosition y must be a non-negative integer, got ${y}`);
    }
    return new TokenPosition(x, y);
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  equals(other: TokenPosition | null | undefined): boolean {
    if (!other) return false;
    return this.x === other.x && this.y === other.y;
  }
}
