import { FogStateId } from '../fog-state-id.js';
import { InvalidFogStateIdException } from '../exceptions/invalid-fog-state-id.exception.js';

describe('FogStateId', () => {
  const validCampaignId = '550e8400-e29b-41d4-a716-446655440000';
  const validPlayerId = '660e8400-e29b-41d4-a716-446655440001';

  describe('fromParts', () => {
    it('should create from valid campaign and player UUIDs', () => {
      const id = FogStateId.fromParts(validCampaignId, validPlayerId);
      expect(id.getCampaignId()).toBe(validCampaignId);
      expect(id.getPlayerId()).toBe(validPlayerId);
    });

    it('should produce correct string representation', () => {
      const id = FogStateId.fromParts(validCampaignId, validPlayerId);
      expect(id.toString()).toBe(`${validCampaignId}-${validPlayerId}`);
    });

    it('should throw on invalid campaignId', () => {
      expect(() => FogStateId.fromParts('bad-id', validPlayerId)).toThrow(
        InvalidFogStateIdException,
      );
    });

    it('should throw on empty campaignId', () => {
      expect(() => FogStateId.fromParts('', validPlayerId)).toThrow(
        InvalidFogStateIdException,
      );
    });

    it('should throw on invalid playerId', () => {
      expect(() => FogStateId.fromParts(validCampaignId, 'bad-id')).toThrow(
        InvalidFogStateIdException,
      );
    });

    it('should trim whitespace', () => {
      const id = FogStateId.fromParts(` ${validCampaignId} `, ` ${validPlayerId} `);
      expect(id.getCampaignId()).toBe(validCampaignId);
      expect(id.getPlayerId()).toBe(validPlayerId);
    });
  });

  describe('fromString', () => {
    it('should parse valid combined string', () => {
      const combined = `${validCampaignId}-${validPlayerId}`;
      const id = FogStateId.fromString(combined);
      expect(id.getCampaignId()).toBe(validCampaignId);
      expect(id.getPlayerId()).toBe(validPlayerId);
    });

    it('should throw on empty string', () => {
      expect(() => FogStateId.fromString('')).toThrow(InvalidFogStateIdException);
    });

    it('should throw on malformed string', () => {
      expect(() => FogStateId.fromString('not-valid-at-all')).toThrow(
        InvalidFogStateIdException,
      );
    });
  });

  describe('equals', () => {
    it('should return true for same parts', () => {
      const a = FogStateId.fromParts(validCampaignId, validPlayerId);
      const b = FogStateId.fromParts(validCampaignId, validPlayerId);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different playerId', () => {
      const otherPlayerId = '770e8400-e29b-41d4-a716-446655440002';
      const a = FogStateId.fromParts(validCampaignId, validPlayerId);
      const b = FogStateId.fromParts(validCampaignId, otherPlayerId);
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = FogStateId.fromParts(validCampaignId, validPlayerId);
      expect(a.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const a = FogStateId.fromParts(validCampaignId, validPlayerId);
      expect(a.equals(undefined)).toBe(false);
    });
  });
});
