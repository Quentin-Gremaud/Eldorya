import {
  RejectionReason,
  InvalidRejectionReasonException,
} from '../rejection-reason.js';

describe('RejectionReason', () => {
  describe('fromString()', () => {
    it('should create a valid rejection reason', () => {
      const reason = RejectionReason.fromString('Need more detail');
      expect(reason.toString()).toBe('Need more detail');
    });

    it('should trim whitespace', () => {
      const reason = RejectionReason.fromString('  Need more detail  ');
      expect(reason.toString()).toBe('Need more detail');
    });

    it('should throw for empty string', () => {
      expect(() => RejectionReason.fromString('')).toThrow(
        InvalidRejectionReasonException,
      );
    });

    it('should throw for whitespace-only string', () => {
      expect(() => RejectionReason.fromString('   ')).toThrow(
        InvalidRejectionReasonException,
      );
    });

    it('should throw for reason exceeding 500 chars', () => {
      const longReason = 'a'.repeat(501);
      expect(() => RejectionReason.fromString(longReason)).toThrow(
        InvalidRejectionReasonException,
      );
    });

    it('should accept reason at exactly 500 chars', () => {
      const exactReason = 'a'.repeat(500);
      const reason = RejectionReason.fromString(exactReason);
      expect(reason.toString()).toBe(exactReason);
    });
  });

  describe('toString()', () => {
    it('should return the reason string', () => {
      const reason = RejectionReason.fromString('Background too vague');
      expect(reason.toString()).toBe('Background too vague');
    });
  });

  describe('equals()', () => {
    it('should return true for equal reasons', () => {
      const reason1 = RejectionReason.fromString('Need more detail');
      const reason2 = RejectionReason.fromString('Need more detail');
      expect(reason1.equals(reason2)).toBe(true);
    });

    it('should return false for different reasons', () => {
      const reason1 = RejectionReason.fromString('Need more detail');
      const reason2 = RejectionReason.fromString('Stats are unbalanced');
      expect(reason1.equals(reason2)).toBe(false);
    });

    it('should return false for null', () => {
      const reason = RejectionReason.fromString('Need more detail');
      expect(reason.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const reason = RejectionReason.fromString('Need more detail');
      expect(reason.equals(undefined)).toBe(false);
    });
  });
});
