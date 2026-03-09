import { CampaignName, InvalidCampaignNameException } from '../campaign-name.js';

describe('CampaignName', () => {
  describe('fromString()', () => {
    it('should create a valid campaign name', () => {
      const name = CampaignName.fromString('My Campaign');
      expect(name.toString()).toBe('My Campaign');
    });

    it('should trim whitespace', () => {
      const name = CampaignName.fromString('  My Campaign  ');
      expect(name.toString()).toBe('My Campaign');
    });

    it('should throw InvalidCampaignNameException for empty string', () => {
      expect(() => CampaignName.fromString('')).toThrow(
        InvalidCampaignNameException,
      );
    });

    it('should throw with correct message for empty string', () => {
      expect(() => CampaignName.fromString('')).toThrow(
        'Campaign name cannot be empty.',
      );
    });

    it('should throw InvalidCampaignNameException for whitespace-only string', () => {
      expect(() => CampaignName.fromString('   ')).toThrow(
        InvalidCampaignNameException,
      );
    });

    it('should throw InvalidCampaignNameException for name exceeding 100 chars', () => {
      const longName = 'a'.repeat(101);
      expect(() => CampaignName.fromString(longName)).toThrow(
        InvalidCampaignNameException,
      );
    });

    it('should throw with correct message for too long name', () => {
      const longName = 'a'.repeat(101);
      expect(() => CampaignName.fromString(longName)).toThrow(
        'Campaign name cannot exceed 100 characters.',
      );
    });

    it('should accept name at exactly 100 chars', () => {
      const exactName = 'a'.repeat(100);
      const name = CampaignName.fromString(exactName);
      expect(name.toString()).toBe(exactName);
    });
  });

  describe('equals()', () => {
    it('should return true for equal names', () => {
      const name1 = CampaignName.fromString('My Campaign');
      const name2 = CampaignName.fromString('My Campaign');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should return false for different names', () => {
      const name1 = CampaignName.fromString('Campaign A');
      const name2 = CampaignName.fromString('Campaign B');
      expect(name1.equals(name2)).toBe(false);
    });
  });
});
