import { MapLevelDepth } from '../map-level-depth.js';
import { InvalidMapLevelDepthException } from '../exceptions/invalid-map-level-depth.exception.js';

describe('MapLevelDepth', () => {
  it('should create depth 0', () => {
    const depth = MapLevelDepth.create(0);
    expect(depth.toNumber()).toBe(0);
  });

  it('should create depth 9 (max)', () => {
    const depth = MapLevelDepth.create(9);
    expect(depth.toNumber()).toBe(9);
  });

  it('should accept depth 5 (mid-range)', () => {
    const depth = MapLevelDepth.create(5);
    expect(depth.toNumber()).toBe(5);
  });

  it('should throw on negative depth', () => {
    expect(() => MapLevelDepth.create(-1)).toThrow(InvalidMapLevelDepthException);
  });

  it('should throw on depth 10 (exceeds max)', () => {
    expect(() => MapLevelDepth.create(10)).toThrow(InvalidMapLevelDepthException);
  });

  it('should throw on non-integer', () => {
    expect(() => MapLevelDepth.create(1.5)).toThrow(InvalidMapLevelDepthException);
  });

  describe('fromPrimitives', () => {
    it('should create from valid depth', () => {
      const depth = MapLevelDepth.fromPrimitives(3);
      expect(depth.toNumber()).toBe(3);
    });

    it('should throw on non-integer', () => {
      expect(() => MapLevelDepth.fromPrimitives(2.5)).toThrow('Corrupted event stream');
    });

    it('should throw on out of range', () => {
      expect(() => MapLevelDepth.fromPrimitives(10)).toThrow('Corrupted event stream');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      expect(MapLevelDepth.create(3).equals(MapLevelDepth.create(3))).toBe(true);
    });

    it('should return false for different value', () => {
      expect(MapLevelDepth.create(3).equals(MapLevelDepth.create(5))).toBe(false);
    });

    it('should return false for null', () => {
      expect(MapLevelDepth.create(3).equals(null)).toBe(false);
    });
  });
});
