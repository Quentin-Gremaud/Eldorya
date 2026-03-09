import { TokenType } from '../token-type.js';
import { InvalidTokenTypeException } from '../exceptions/invalid-token-type.exception.js';

describe('TokenType', () => {
  it('should create from "player"', () => {
    const type = TokenType.fromString('player');
    expect(type.toString()).toBe('player');
  });

  it('should create from "npc"', () => {
    const type = TokenType.fromString('npc');
    expect(type.toString()).toBe('npc');
  });

  it('should create from "monster"', () => {
    const type = TokenType.fromString('monster');
    expect(type.toString()).toBe('monster');
  });

  it('should be case-insensitive', () => {
    const type = TokenType.fromString('Player');
    expect(type.toString()).toBe('player');
  });

  it('should trim whitespace', () => {
    const type = TokenType.fromString(' npc ');
    expect(type.toString()).toBe('npc');
  });

  it('should throw on empty string', () => {
    expect(() => TokenType.fromString('')).toThrow(InvalidTokenTypeException);
  });

  it('should throw on invalid value', () => {
    expect(() => TokenType.fromString('boss')).toThrow(InvalidTokenTypeException);
  });

  describe('equals', () => {
    it('should return true for same type', () => {
      const a = TokenType.fromString('player');
      const b = TokenType.fromString('player');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different types', () => {
      const a = TokenType.fromString('player');
      const b = TokenType.fromString('npc');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = TokenType.fromString('player');
      expect(a.equals(null)).toBe(false);
    });
  });
});
