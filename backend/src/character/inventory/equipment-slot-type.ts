import { DomainException } from '../../shared/exceptions/domain.exception.js';

export class InvalidEquipmentSlotTypeException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static unknownValue(value: string): InvalidEquipmentSlotTypeException {
    return new InvalidEquipmentSlotTypeException(
      `Invalid equipment slot type: '${value}'. Allowed: ${EquipmentSlotType.ALLOWED_TYPES.join(', ')}.`,
    );
  }
}

export class EquipmentSlotType {
  static readonly ALLOWED_TYPES = [
    'head',
    'torso',
    'hands',
    'legs',
    'feet',
    'ring1',
    'ring2',
    'weapon_shield',
  ] as const;

  private constructor(private readonly value: string) {}

  static fromString(value: string): EquipmentSlotType {
    if (
      !EquipmentSlotType.ALLOWED_TYPES.includes(
        value as (typeof EquipmentSlotType.ALLOWED_TYPES)[number],
      )
    ) {
      throw InvalidEquipmentSlotTypeException.unknownValue(value);
    }
    return new EquipmentSlotType(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: EquipmentSlotType): boolean {
    return this.value === other.value;
  }
}
