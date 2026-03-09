import { MapBackgroundImageUrl } from '../map-background-image-url.js';
import { InvalidMapBackgroundImageUrlException } from '../exceptions/invalid-map-background-image-url.exception.js';

describe('MapBackgroundImageUrl', () => {
  describe('create', () => {
    it('should create a valid URL', () => {
      const url = MapBackgroundImageUrl.create('https://cdn.example.com/image.jpg');
      expect(url.toString()).toBe('https://cdn.example.com/image.jpg');
    });

    it('should trim whitespace', () => {
      const url = MapBackgroundImageUrl.create('  https://cdn.example.com/image.jpg  ');
      expect(url.toString()).toBe('https://cdn.example.com/image.jpg');
    });

    it('should throw InvalidMapBackgroundImageUrlException on empty string', () => {
      expect(() => MapBackgroundImageUrl.create('')).toThrow(InvalidMapBackgroundImageUrlException);
    });

    it('should throw InvalidMapBackgroundImageUrlException on whitespace-only string', () => {
      expect(() => MapBackgroundImageUrl.create('   ')).toThrow(InvalidMapBackgroundImageUrlException);
    });

    it('should accept URL at exactly 2048 characters', () => {
      const url = 'https://example.com/' + 'a'.repeat(2028);
      expect(url.length).toBe(2048);
      expect(() => MapBackgroundImageUrl.create(url)).not.toThrow();
    });

    it('should throw InvalidMapBackgroundImageUrlException on URL exceeding 2048 characters', () => {
      const url = 'https://example.com/' + 'a'.repeat(2029);
      expect(url.length).toBe(2049);
      expect(() => MapBackgroundImageUrl.create(url)).toThrow(InvalidMapBackgroundImageUrlException);
    });
  });

  describe('fromPrimitives', () => {
    it('should create from valid primitives', () => {
      const url = MapBackgroundImageUrl.fromPrimitives('https://cdn.example.com/image.jpg');
      expect(url.toString()).toBe('https://cdn.example.com/image.jpg');
    });

    it('should throw Error on empty string (corrupted event stream)', () => {
      expect(() => MapBackgroundImageUrl.fromPrimitives('')).toThrow('Corrupted event stream');
    });

    it('should throw Error on URL exceeding max length (corrupted event stream)', () => {
      const url = 'https://example.com/' + 'a'.repeat(2029);
      expect(() => MapBackgroundImageUrl.fromPrimitives(url)).toThrow('Corrupted event stream');
    });
  });

  describe('equals', () => {
    it('should return true for equal URLs', () => {
      const url1 = MapBackgroundImageUrl.create('https://cdn.example.com/img.jpg');
      const url2 = MapBackgroundImageUrl.create('https://cdn.example.com/img.jpg');
      expect(url1.equals(url2)).toBe(true);
    });

    it('should return false for different URLs', () => {
      const url1 = MapBackgroundImageUrl.create('https://cdn.example.com/img1.jpg');
      const url2 = MapBackgroundImageUrl.create('https://cdn.example.com/img2.jpg');
      expect(url1.equals(url2)).toBe(false);
    });

    it('should return false for null', () => {
      const url = MapBackgroundImageUrl.create('https://cdn.example.com/img.jpg');
      expect(url.equals(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      const url = MapBackgroundImageUrl.create('https://cdn.example.com/img.jpg');
      expect(url.equals(undefined)).toBe(false);
    });
  });
});
