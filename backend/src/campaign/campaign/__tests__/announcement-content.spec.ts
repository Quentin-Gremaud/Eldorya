import {
  AnnouncementContent,
  InvalidAnnouncementContentException,
} from '../announcement-content.js';

describe('AnnouncementContent', () => {
  describe('fromString()', () => {
    it('should create from valid string', () => {
      const content = AnnouncementContent.fromString('Hello players!');
      expect(content.toString()).toBe('Hello players!');
    });

    it('should trim whitespace', () => {
      const content = AnnouncementContent.fromString('  Hello!  ');
      expect(content.toString()).toBe('Hello!');
    });

    it('should strip HTML tags', () => {
      const content = AnnouncementContent.fromString(
        '<script>alert("xss")</script>Hello <b>world</b>',
      );
      expect(content.toString()).toBe('alert("xss")Hello world');
    });

    it('should reject empty content', () => {
      expect(() => AnnouncementContent.fromString('')).toThrow(
        InvalidAnnouncementContentException,
      );
      expect(() => AnnouncementContent.fromString('')).toThrow(
        'Announcement content cannot be empty.',
      );
    });

    it('should reject content that is only whitespace', () => {
      expect(() => AnnouncementContent.fromString('   ')).toThrow(
        InvalidAnnouncementContentException,
      );
    });

    it('should reject content that is only HTML tags', () => {
      expect(() => AnnouncementContent.fromString('<br><hr>')).toThrow(
        InvalidAnnouncementContentException,
      );
    });

    it('should reject content exceeding 2000 characters', () => {
      const longContent = 'a'.repeat(2001);
      expect(() => AnnouncementContent.fromString(longContent)).toThrow(
        InvalidAnnouncementContentException,
      );
      expect(() => AnnouncementContent.fromString(longContent)).toThrow(
        'Announcement content cannot exceed 2000 characters.',
      );
    });

    it('should accept content at exactly 2000 characters', () => {
      const content = AnnouncementContent.fromString('a'.repeat(2000));
      expect(content.toString()).toHaveLength(2000);
    });
  });

  describe('equals()', () => {
    it('should return true for equal content', () => {
      const a = AnnouncementContent.fromString('Hello');
      const b = AnnouncementContent.fromString('Hello');
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different content', () => {
      const a = AnnouncementContent.fromString('Hello');
      const b = AnnouncementContent.fromString('World');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null', () => {
      const a = AnnouncementContent.fromString('Hello');
      expect(a.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const a = AnnouncementContent.fromString('Hello');
      expect(a.equals(undefined)).toBe(false);
    });
  });
});
