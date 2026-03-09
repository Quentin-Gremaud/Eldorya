import { TokenId } from '../token-id.js';
import { InvalidTokenIdException } from '../exceptions/invalid-token-id.exception.js';

describe('TokenId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should create from valid UUID string', () => {
    const id = TokenId.fromString(validUuid);
    expect(id.toString()).toBe(validUuid);
  });

  it('should throw on empty string', () => {
    expect(() => TokenId.fromString('')).toThrow(InvalidTokenIdException);
  });

  it('should throw on whitespace-only string', () => {
    expect(() => TokenId.fromString('   ')).toThrow(InvalidTokenIdException);
  });

  it('should throw on invalid UUID format', () => {
    expect(() => TokenId.fromString('not-a-uuid')).toThrow(InvalidTokenIdException);
  });

  it('should trim whitespace', () => {
    const id = TokenId.fromString(` ${validUuid} `);
    expect(id.toString()).toBe(validUuid);
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = TokenId.fromString(validUuid);
      const b = TokenId.fromString(validUuid);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different value', () => {
      const a = TokenId.fromString(validUuid);
      const b = TokenId.fromString('660e8400-e29b-41d4-a716-446655440000');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = TokenId.fromString(validUuid);
      expect(a.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const a = TokenId.fromString(validUuid);
      expect(a.equals(undefined)).toBe(false);
    });
  });
});
