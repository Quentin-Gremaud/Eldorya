import { InvalidFogZoneException } from './exceptions/invalid-fog-zone.exception.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class FogZone {
  private constructor(
    private readonly _id: string,
    private readonly _mapLevelId: string,
    private readonly _x: number,
    private readonly _y: number,
    private readonly _width: number,
    private readonly _height: number,
  ) {}

  static create(
    id: string,
    mapLevelId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): FogZone {
    if (!id || !UUID_REGEX.test(id.trim())) {
      throw InvalidFogZoneException.invalidId(id);
    }
    if (!mapLevelId || !UUID_REGEX.test(mapLevelId.trim())) {
      throw InvalidFogZoneException.invalidMapLevelId(mapLevelId);
    }
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      throw InvalidFogZoneException.invalidCoordinate('x', x);
    }
    if (typeof y !== 'number' || !Number.isFinite(y)) {
      throw InvalidFogZoneException.invalidCoordinate('y', y);
    }
    if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) {
      throw InvalidFogZoneException.invalidDimension('width', width);
    }
    if (typeof height !== 'number' || !Number.isFinite(height) || height <= 0) {
      throw InvalidFogZoneException.invalidDimension('height', height);
    }
    return new FogZone(id.trim(), mapLevelId.trim(), x, y, width, height);
  }

  static fromPrimitives(
    id: string,
    mapLevelId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): FogZone {
    if (typeof id !== 'string' || !id) {
      throw new Error('Corrupted event stream: FogZone id must be a non-empty string');
    }
    if (typeof mapLevelId !== 'string' || !mapLevelId) {
      throw new Error('Corrupted event stream: FogZone mapLevelId must be a non-empty string');
    }
    if (typeof x !== 'number' || !Number.isFinite(x)) {
      throw new Error('Corrupted event stream: FogZone x must be a finite number');
    }
    if (typeof y !== 'number' || !Number.isFinite(y)) {
      throw new Error('Corrupted event stream: FogZone y must be a finite number');
    }
    if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) {
      throw new Error('Corrupted event stream: FogZone width must be a positive number');
    }
    if (typeof height !== 'number' || !Number.isFinite(height) || height <= 0) {
      throw new Error('Corrupted event stream: FogZone height must be a positive number');
    }
    return new FogZone(id, mapLevelId, x, y, width, height);
  }

  getId(): string {
    return this._id;
  }

  getMapLevelId(): string {
    return this._mapLevelId;
  }

  getX(): number {
    return this._x;
  }

  getY(): number {
    return this._y;
  }

  getWidth(): number {
    return this._width;
  }

  getHeight(): number {
    return this._height;
  }

  equals(other: FogZone | null | undefined): boolean {
    if (!other) return false;
    return this._id === other._id;
  }
}
