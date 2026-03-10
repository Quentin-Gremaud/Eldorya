import { FogZone } from '../fog-zone.js';
import { InvalidFogZoneException } from '../exceptions/invalid-fog-zone.exception.js';

describe('FogZone', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';
  const validMapLevelId = '660e8400-e29b-41d4-a716-446655440001';

  describe('create', () => {
    it('should create a valid FogZone', () => {
      const zone = FogZone.create(validId, validMapLevelId, 10, 20, 100, 200);
      expect(zone.getId()).toBe(validId);
      expect(zone.getMapLevelId()).toBe(validMapLevelId);
      expect(zone.getX()).toBe(10);
      expect(zone.getY()).toBe(20);
      expect(zone.getWidth()).toBe(100);
      expect(zone.getHeight()).toBe(200);
    });

    it('should throw on invalid id', () => {
      expect(() => FogZone.create('bad-id', validMapLevelId, 10, 20, 100, 200)).toThrow(
        InvalidFogZoneException,
      );
    });

    it('should throw on empty id', () => {
      expect(() => FogZone.create('', validMapLevelId, 10, 20, 100, 200)).toThrow(
        InvalidFogZoneException,
      );
    });

    it('should throw on invalid mapLevelId', () => {
      expect(() => FogZone.create(validId, 'bad-id', 10, 20, 100, 200)).toThrow(
        InvalidFogZoneException,
      );
    });

    it('should throw on non-finite x', () => {
      expect(() => FogZone.create(validId, validMapLevelId, NaN, 20, 100, 200)).toThrow(
        InvalidFogZoneException,
      );
    });

    it('should throw on non-finite y', () => {
      expect(() => FogZone.create(validId, validMapLevelId, 10, Infinity, 100, 200)).toThrow(
        InvalidFogZoneException,
      );
    });

    it('should throw on zero width', () => {
      expect(() => FogZone.create(validId, validMapLevelId, 10, 20, 0, 200)).toThrow(
        InvalidFogZoneException,
      );
    });

    it('should throw on negative height', () => {
      expect(() => FogZone.create(validId, validMapLevelId, 10, 20, 100, -5)).toThrow(
        InvalidFogZoneException,
      );
    });

    it('should trim whitespace from id and mapLevelId', () => {
      const zone = FogZone.create(` ${validId} `, ` ${validMapLevelId} `, 10, 20, 100, 200);
      expect(zone.getId()).toBe(validId);
      expect(zone.getMapLevelId()).toBe(validMapLevelId);
    });

    it('should allow negative coordinates', () => {
      const zone = FogZone.create(validId, validMapLevelId, -50, -30, 100, 200);
      expect(zone.getX()).toBe(-50);
      expect(zone.getY()).toBe(-30);
    });
  });

  describe('fromPrimitives', () => {
    it('should reconstruct from valid primitives', () => {
      const zone = FogZone.fromPrimitives(validId, validMapLevelId, 10, 20, 100, 200);
      expect(zone.getId()).toBe(validId);
      expect(zone.getMapLevelId()).toBe(validMapLevelId);
    });

    it('should throw on invalid id type', () => {
      expect(() =>
        FogZone.fromPrimitives(123 as unknown as string, validMapLevelId, 10, 20, 100, 200),
      ).toThrow('Corrupted event stream');
    });

    it('should throw on empty id', () => {
      expect(() =>
        FogZone.fromPrimitives('', validMapLevelId, 10, 20, 100, 200),
      ).toThrow('Corrupted event stream');
    });

    it('should throw on invalid x type', () => {
      expect(() =>
        FogZone.fromPrimitives(validId, validMapLevelId, 'ten' as unknown as number, 20, 100, 200),
      ).toThrow('Corrupted event stream');
    });

    it('should throw on non-finite x', () => {
      expect(() =>
        FogZone.fromPrimitives(validId, validMapLevelId, NaN, 20, 100, 200),
      ).toThrow('Corrupted event stream');
    });

    it('should throw on non-finite y', () => {
      expect(() =>
        FogZone.fromPrimitives(validId, validMapLevelId, 10, Infinity, 100, 200),
      ).toThrow('Corrupted event stream');
    });

    it('should throw on zero width', () => {
      expect(() =>
        FogZone.fromPrimitives(validId, validMapLevelId, 10, 20, 0, 200),
      ).toThrow('Corrupted event stream');
    });

    it('should throw on negative width', () => {
      expect(() =>
        FogZone.fromPrimitives(validId, validMapLevelId, 10, 20, -5, 200),
      ).toThrow('Corrupted event stream');
    });

    it('should throw on negative height', () => {
      expect(() =>
        FogZone.fromPrimitives(validId, validMapLevelId, 10, 20, 100, -10),
      ).toThrow('Corrupted event stream');
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const a = FogZone.create(validId, validMapLevelId, 10, 20, 100, 200);
      const b = FogZone.create(validId, validMapLevelId, 30, 40, 150, 250);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different id', () => {
      const otherId = '770e8400-e29b-41d4-a716-446655440002';
      const a = FogZone.create(validId, validMapLevelId, 10, 20, 100, 200);
      const b = FogZone.create(otherId, validMapLevelId, 10, 20, 100, 200);
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = FogZone.create(validId, validMapLevelId, 10, 20, 100, 200);
      expect(a.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const a = FogZone.create(validId, validMapLevelId, 10, 20, 100, 200);
      expect(a.equals(undefined)).toBe(false);
    });
  });
});
