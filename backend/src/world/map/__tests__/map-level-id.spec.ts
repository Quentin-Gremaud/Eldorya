import { MapLevelId } from '../map-level-id.js';
import { InvalidMapLevelIdException } from '../exceptions/invalid-map-level-id.exception.js';

describe('MapLevelId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should create from valid UUID string', () => {
    const id = MapLevelId.fromString(validUuid);
    expect(id.toString()).toBe(validUuid);
  });

  it('should throw on empty string', () => {
    expect(() => MapLevelId.fromString('')).toThrow(InvalidMapLevelIdException);
  });

  it('should throw on whitespace-only string', () => {
    expect(() => MapLevelId.fromString('   ')).toThrow(InvalidMapLevelIdException);
  });

  it('should throw on invalid UUID format', () => {
    expect(() => MapLevelId.fromString('not-a-uuid')).toThrow(InvalidMapLevelIdException);
  });

  it('should trim whitespace', () => {
    const id = MapLevelId.fromString(` ${validUuid} `);
    expect(id.toString()).toBe(validUuid);
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const a = MapLevelId.fromString(validUuid);
      const b = MapLevelId.fromString(validUuid);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different value', () => {
      const a = MapLevelId.fromString(validUuid);
      const b = MapLevelId.fromString('660e8400-e29b-41d4-a716-446655440000');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = MapLevelId.fromString(validUuid);
      expect(a.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const a = MapLevelId.fromString(validUuid);
      expect(a.equals(undefined)).toBe(false);
    });
  });
});
