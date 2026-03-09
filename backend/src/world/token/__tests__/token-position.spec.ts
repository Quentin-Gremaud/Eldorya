import { TokenPosition } from '../token-position.js';
import { InvalidTokenPositionException } from '../exceptions/invalid-token-position.exception.js';

describe('TokenPosition', () => {
  describe('create', () => {
    it('should create with valid non-negative integers', () => {
      const pos = TokenPosition.create(100, 200);
      expect(pos.getX()).toBe(100);
      expect(pos.getY()).toBe(200);
    });

    it('should accept zero values', () => {
      const pos = TokenPosition.create(0, 0);
      expect(pos.getX()).toBe(0);
      expect(pos.getY()).toBe(0);
    });

    it('should throw on negative x', () => {
      expect(() => TokenPosition.create(-1, 0)).toThrow(InvalidTokenPositionException);
    });

    it('should throw on negative y', () => {
      expect(() => TokenPosition.create(0, -5)).toThrow(InvalidTokenPositionException);
    });

    it('should throw on non-integer x', () => {
      expect(() => TokenPosition.create(1.5, 0)).toThrow(InvalidTokenPositionException);
    });

    it('should throw on non-integer y', () => {
      expect(() => TokenPosition.create(0, 2.7)).toThrow(InvalidTokenPositionException);
    });
  });

  describe('fromPrimitives', () => {
    it('should create from valid values', () => {
      const pos = TokenPosition.fromPrimitives(50, 75);
      expect(pos.getX()).toBe(50);
      expect(pos.getY()).toBe(75);
    });

    it('should throw on invalid values', () => {
      expect(() => TokenPosition.fromPrimitives(-1, 0)).toThrow('Corrupted event stream');
    });
  });

  describe('equals', () => {
    it('should return true for same coordinates', () => {
      const a = TokenPosition.create(10, 20);
      const b = TokenPosition.create(10, 20);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different coordinates', () => {
      const a = TokenPosition.create(10, 20);
      const b = TokenPosition.create(30, 40);
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = TokenPosition.create(10, 20);
      expect(a.equals(null)).toBe(false);
    });
  });
});
