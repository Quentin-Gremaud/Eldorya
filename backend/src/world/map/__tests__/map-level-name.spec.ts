import { MapLevelName } from '../map-level-name.js';
import { InvalidMapLevelNameException } from '../exceptions/invalid-map-level-name.exception.js';

describe('MapLevelName', () => {
  it('should create from valid name', () => {
    const name = MapLevelName.create('World');
    expect(name.toString()).toBe('World');
  });

  it('should trim whitespace', () => {
    const name = MapLevelName.create('  Tavern  ');
    expect(name.toString()).toBe('Tavern');
  });

  it('should accept name with exactly 100 characters', () => {
    const longName = 'a'.repeat(100);
    const name = MapLevelName.create(longName);
    expect(name.toString()).toBe(longName);
  });

  it('should throw on empty string', () => {
    expect(() => MapLevelName.create('')).toThrow(InvalidMapLevelNameException);
  });

  it('should throw on whitespace-only string', () => {
    expect(() => MapLevelName.create('   ')).toThrow(InvalidMapLevelNameException);
  });

  it('should throw on name exceeding 100 characters', () => {
    const longName = 'a'.repeat(101);
    expect(() => MapLevelName.create(longName)).toThrow(InvalidMapLevelNameException);
  });

  describe('fromPrimitives', () => {
    it('should create from valid name', () => {
      const name = MapLevelName.fromPrimitives('Region');
      expect(name.toString()).toBe('Region');
    });

    it('should throw on empty', () => {
      expect(() => MapLevelName.fromPrimitives('')).toThrow('Corrupted event stream');
    });

    it('should throw on name exceeding max length', () => {
      expect(() => MapLevelName.fromPrimitives('a'.repeat(101))).toThrow('Corrupted event stream');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      expect(MapLevelName.create('City').equals(MapLevelName.create('City'))).toBe(true);
    });

    it('should return false for different value', () => {
      expect(MapLevelName.create('City').equals(MapLevelName.create('Town'))).toBe(false);
    });

    it('should return false for null', () => {
      expect(MapLevelName.create('City').equals(null)).toBe(false);
    });
  });
});
