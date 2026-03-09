import { InvalidMapLevelNameException } from './exceptions/invalid-map-level-name.exception.js';

export class MapLevelName {
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly value: string) {}

  static create(name: string): MapLevelName {
    if (!name || !name.trim()) {
      throw InvalidMapLevelNameException.empty();
    }
    const trimmed = name.trim();
    if (trimmed.length > MapLevelName.MAX_LENGTH) {
      throw InvalidMapLevelNameException.tooLong(trimmed);
    }
    return new MapLevelName(trimmed);
  }

  static fromPrimitives(name: string): MapLevelName {
    if (!name || !name.trim()) {
      throw new Error('Corrupted event stream: MapLevelName cannot be empty');
    }
    const trimmed = name.trim();
    if (trimmed.length > MapLevelName.MAX_LENGTH) {
      throw new Error('Corrupted event stream: MapLevelName exceeds max length');
    }
    return new MapLevelName(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MapLevelName | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
