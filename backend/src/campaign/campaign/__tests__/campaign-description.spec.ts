import {
  CampaignDescription,
  InvalidCampaignDescriptionException,
} from '../campaign-description.js';

describe('CampaignDescription', () => {
  describe('fromString()', () => {
    it('should create a valid description', () => {
      const desc = CampaignDescription.fromString('A great campaign');
      expect(desc.toString()).toBe('A great campaign');
    });

    it('should allow empty string via fromString', () => {
      const desc = CampaignDescription.fromString('');
      expect(desc.toString()).toBe('');
      expect(desc.isEmpty()).toBe(true);
    });

    it('should throw InvalidCampaignDescriptionException for description exceeding 500 chars', () => {
      const longDesc = 'a'.repeat(501);
      expect(() => CampaignDescription.fromString(longDesc)).toThrow(
        InvalidCampaignDescriptionException,
      );
    });

    it('should throw with correct message for too long description', () => {
      const longDesc = 'a'.repeat(501);
      expect(() => CampaignDescription.fromString(longDesc)).toThrow(
        'Campaign description cannot exceed 500 characters.',
      );
    });

    it('should accept description at exactly 500 chars', () => {
      const exactDesc = 'a'.repeat(500);
      const desc = CampaignDescription.fromString(exactDesc);
      expect(desc.toString()).toBe(exactDesc);
    });
  });

  describe('empty()', () => {
    it('should create an empty description', () => {
      const desc = CampaignDescription.empty();
      expect(desc.toString()).toBe('');
      expect(desc.isEmpty()).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return true for equal descriptions', () => {
      const desc1 = CampaignDescription.fromString('Test');
      const desc2 = CampaignDescription.fromString('Test');
      expect(desc1.equals(desc2)).toBe(true);
    });

    it('should return false for different descriptions', () => {
      const desc1 = CampaignDescription.fromString('Desc A');
      const desc2 = CampaignDescription.fromString('Desc B');
      expect(desc1.equals(desc2)).toBe(false);
    });

    it('should return true for two empty descriptions', () => {
      const desc1 = CampaignDescription.empty();
      const desc2 = CampaignDescription.empty();
      expect(desc1.equals(desc2)).toBe(true);
    });
  });
});
