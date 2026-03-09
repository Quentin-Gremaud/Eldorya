import { CampaignStatus } from '../campaign-status.js';

describe('CampaignStatus', () => {
  describe('factory methods', () => {
    it('should create active status', () => {
      const status = CampaignStatus.active();
      expect(status.toString()).toBe('active');
      expect(status.isActive()).toBe(true);
      expect(status.isArchived()).toBe(false);
    });

    it('should create archived status', () => {
      const status = CampaignStatus.archived();
      expect(status.toString()).toBe('archived');
      expect(status.isArchived()).toBe(true);
      expect(status.isActive()).toBe(false);
    });

    it('should create readonly status', () => {
      const status = CampaignStatus.readonly();
      expect(status.toString()).toBe('readonly');
      expect(status.isActive()).toBe(false);
      expect(status.isArchived()).toBe(false);
    });
  });

  describe('equals()', () => {
    it('should return true for same status', () => {
      expect(CampaignStatus.active().equals(CampaignStatus.active())).toBe(
        true,
      );
    });

    it('should return false for different statuses', () => {
      expect(CampaignStatus.active().equals(CampaignStatus.archived())).toBe(
        false,
      );
    });
  });
});
