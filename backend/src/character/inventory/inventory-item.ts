import { DomainException } from '../../shared/exceptions/domain.exception.js';
import { EquipmentSlotType } from './equipment-slot-type.js';

export class InvalidInventoryItemException extends DomainException {
  private constructor(message: string) {
    super(message);
  }

  static emptyId(): InvalidInventoryItemException {
    return new InvalidInventoryItemException('Inventory item id cannot be empty.');
  }

  static emptyName(): InvalidInventoryItemException {
    return new InvalidInventoryItemException('Inventory item name cannot be empty.');
  }

  static nameTooLong(name: string): InvalidInventoryItemException {
    return new InvalidInventoryItemException(
      `Inventory item name '${name}' exceeds maximum length of 100 characters.`,
    );
  }

  static negativeWeight(weight: number): InvalidInventoryItemException {
    return new InvalidInventoryItemException(
      `Inventory item weight cannot be negative: ${weight}.`,
    );
  }

  static descriptionTooLong(length: number): InvalidInventoryItemException {
    return new InvalidInventoryItemException(
      `Inventory item description exceeds maximum length of 1000 characters (got ${length}).`,
    );
  }

  static invalidStatModifierValue(key: string, value: unknown): InvalidInventoryItemException {
    return new InvalidInventoryItemException(
      `Inventory item stat modifier '${key}' must be a number, got ${typeof value}.`,
    );
  }

  static withMessage(message: string): InvalidInventoryItemException {
    return new InvalidInventoryItemException(message);
  }
}

export interface InventoryItemData {
  id: string;
  name: string;
  description: string;
  weight: number;
  slotType: string;
  statModifiers: Record<string, number>;
}

export class InventoryItem {
  private static readonly MAX_NAME_LENGTH = 100;
  private static readonly MAX_DESCRIPTION_LENGTH = 1000;

  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string,
    private readonly weight: number,
    private readonly slotType: string,
    private readonly statModifiers: Record<string, number>,
  ) {}

  static create(data: InventoryItemData): InventoryItem {
    if (!data.id || data.id.trim().length === 0) {
      throw InvalidInventoryItemException.emptyId();
    }
    if (!data.name || data.name.trim().length === 0) {
      throw InvalidInventoryItemException.emptyName();
    }
    if (data.name.length > InventoryItem.MAX_NAME_LENGTH) {
      throw InvalidInventoryItemException.nameTooLong(data.name);
    }
    if (data.weight < 0) {
      throw InvalidInventoryItemException.negativeWeight(data.weight);
    }
    if (!EquipmentSlotType.ALLOWED_TYPES.includes(data.slotType as any)) {
      throw InvalidInventoryItemException.withMessage(`Invalid slot type: ${data.slotType}`);
    }
    if (data.description && data.description.length > InventoryItem.MAX_DESCRIPTION_LENGTH) {
      throw InvalidInventoryItemException.descriptionTooLong(data.description.length);
    }
    for (const [key, value] of Object.entries(data.statModifiers)) {
      if (typeof value !== 'number') {
        throw InvalidInventoryItemException.invalidStatModifierValue(key, value);
      }
    }

    return new InventoryItem(
      data.id,
      data.name,
      data.description,
      data.weight,
      data.slotType,
      { ...data.statModifiers },
    );
  }

  static fromPrimitives(data: InventoryItemData): InventoryItem {
    if (!data.id || data.id.trim().length === 0) {
      throw InvalidInventoryItemException.emptyId();
    }
    if (!data.name || data.name.trim().length === 0) {
      throw InvalidInventoryItemException.emptyName();
    }
    if (data.weight < 0) {
      throw InvalidInventoryItemException.negativeWeight(data.weight);
    }
    if (!EquipmentSlotType.ALLOWED_TYPES.includes(data.slotType as any)) {
      throw InvalidInventoryItemException.withMessage(`Invalid slot type: ${data.slotType}`);
    }
    if (data.description && data.description.length > InventoryItem.MAX_DESCRIPTION_LENGTH) {
      throw InvalidInventoryItemException.descriptionTooLong(data.description.length);
    }

    return new InventoryItem(
      data.id,
      data.name,
      data.description,
      data.weight,
      data.slotType,
      { ...data.statModifiers },
    );
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getWeight(): number {
    return this.weight;
  }

  getSlotType(): string {
    return this.slotType;
  }

  getStatModifiers(): Record<string, number> {
    return { ...this.statModifiers };
  }

  toPrimitives(): InventoryItemData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      weight: this.weight,
      slotType: this.slotType,
      statModifiers: { ...this.statModifiers },
    };
  }

  canEquipTo(slotType: string): boolean {
    return this.slotType === slotType;
  }

  equals(other: InventoryItem): boolean {
    return this.id === other.id;
  }
}
