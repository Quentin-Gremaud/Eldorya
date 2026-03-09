import { InvalidMapLevelIdException } from './exceptions/invalid-map-level-id.exception.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class MapLevelId {
  private constructor(private readonly value: string) {}

  static fromString(id: string): MapLevelId {
    if (!id || !id.trim()) {
      throw InvalidMapLevelIdException.empty();
    }
    const trimmed = id.trim();
    if (!UUID_REGEX.test(trimmed)) {
      throw InvalidMapLevelIdException.invalidFormat(trimmed);
    }
    return new MapLevelId(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MapLevelId | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
