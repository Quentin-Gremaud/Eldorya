import { DomainException } from '../../../shared/exceptions/domain.exception.js';

export class InvalidFogZoneException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static invalidId(id: string): InvalidFogZoneException {
    return new InvalidFogZoneException(
      `Invalid FogZone id: '${id}'. Must be a valid UUID.`,
    );
  }

  static invalidMapLevelId(mapLevelId: string): InvalidFogZoneException {
    return new InvalidFogZoneException(
      `Invalid FogZone mapLevelId: '${mapLevelId}'. Must be a valid UUID.`,
    );
  }

  static invalidCoordinate(name: string, value: unknown): InvalidFogZoneException {
    return new InvalidFogZoneException(
      `Invalid FogZone ${name}: '${value}'. Must be a finite number.`,
    );
  }

  static invalidDimension(name: string, value: unknown): InvalidFogZoneException {
    return new InvalidFogZoneException(
      `Invalid FogZone ${name}: '${value}'. Must be a positive finite number.`,
    );
  }
}
