import { TokenLabel } from '../token-label.js';
import { InvalidTokenLabelException } from '../exceptions/invalid-token-label.exception.js';

describe('TokenLabel', () => {
  describe('create', () => {
    it('should create with valid label', () => {
      const label = TokenLabel.create('Warrior');
      expect(label.toString()).toBe('Warrior');
    });

    it('should trim whitespace', () => {
      const label = TokenLabel.create('  Mage  ');
      expect(label.toString()).toBe('Mage');
    });

    it('should throw on empty string', () => {
      expect(() => TokenLabel.create('')).toThrow(InvalidTokenLabelException);
    });

    it('should throw on whitespace-only string', () => {
      expect(() => TokenLabel.create('   ')).toThrow(InvalidTokenLabelException);
    });

    it('should throw when exceeding 100 characters', () => {
      const longLabel = 'a'.repeat(101);
      expect(() => TokenLabel.create(longLabel)).toThrow(InvalidTokenLabelException);
    });

    it('should accept exactly 100 characters', () => {
      const label = TokenLabel.create('a'.repeat(100));
      expect(label.toString()).toBe('a'.repeat(100));
    });
  });

  describe('fromPrimitives', () => {
    it('should create from valid value', () => {
      const label = TokenLabel.fromPrimitives('Guard');
      expect(label.toString()).toBe('Guard');
    });

    it('should throw on empty value', () => {
      expect(() => TokenLabel.fromPrimitives('')).toThrow('Corrupted event stream');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = TokenLabel.create('Knight');
      const b = TokenLabel.create('Knight');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = TokenLabel.create('Knight');
      const b = TokenLabel.create('Rogue');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = TokenLabel.create('Knight');
      expect(a.equals(null)).toBe(false);
    });
  });
});
