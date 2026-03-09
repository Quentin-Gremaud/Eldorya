import { InvalidMapLevelDepthException } from './exceptions/invalid-map-level-depth.exception.js';

export class MapLevelDepth {
  private static readonly MIN_DEPTH = 0;
  private static readonly MAX_DEPTH = 9;

  private constructor(private readonly value: number) {}

  static create(depth: number): MapLevelDepth {
    if (!Number.isInteger(depth)) {
      throw InvalidMapLevelDepthException.notInteger(depth);
    }
    if (depth < MapLevelDepth.MIN_DEPTH || depth > MapLevelDepth.MAX_DEPTH) {
      throw InvalidMapLevelDepthException.outOfRange(depth);
    }
    return new MapLevelDepth(depth);
  }

  static maxValue(): number {
    return MapLevelDepth.MAX_DEPTH;
  }

  static fromPrimitives(depth: number): MapLevelDepth {
    if (!Number.isInteger(depth)) {
      throw new Error('Corrupted event stream: MapLevelDepth must be an integer');
    }
    if (depth < MapLevelDepth.MIN_DEPTH || depth > MapLevelDepth.MAX_DEPTH) {
      throw new Error(`Corrupted event stream: MapLevelDepth ${depth} out of range 0-9`);
    }
    return new MapLevelDepth(depth);
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: MapLevelDepth | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
