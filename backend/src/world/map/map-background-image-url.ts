import { InvalidMapBackgroundImageUrlException } from './exceptions/invalid-map-background-image-url.exception.js';

export class MapBackgroundImageUrl {
  private static readonly MAX_LENGTH = 2048;

  private constructor(private readonly value: string) {}

  static create(url: string): MapBackgroundImageUrl {
    if (!url || !url.trim()) {
      throw InvalidMapBackgroundImageUrlException.empty();
    }
    const trimmed = url.trim();
    if (trimmed.length > MapBackgroundImageUrl.MAX_LENGTH) {
      throw InvalidMapBackgroundImageUrlException.tooLong(trimmed);
    }
    return new MapBackgroundImageUrl(trimmed);
  }

  static fromPrimitives(url: string): MapBackgroundImageUrl {
    if (!url || !url.trim()) {
      throw new Error('Corrupted event stream: MapBackgroundImageUrl cannot be empty');
    }
    const trimmed = url.trim();
    if (trimmed.length > MapBackgroundImageUrl.MAX_LENGTH) {
      throw new Error('Corrupted event stream: MapBackgroundImageUrl exceeds max length');
    }
    return new MapBackgroundImageUrl(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MapBackgroundImageUrl | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
