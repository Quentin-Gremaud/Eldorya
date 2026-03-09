import { InventoryCreated } from './events/inventory-created.event.js';
import { ItemAddedToInventory } from './events/item-added-to-inventory.event.js';
import { ItemEquipped } from './events/item-equipped.event.js';
import { ItemUnequipped } from './events/item-unequipped.event.js';
import { ItemMoved } from './events/item-moved.event.js';
import { ItemDropped } from './events/item-dropped.event.js';
import { ItemRemovedFromInventory } from './events/item-removed-from-inventory.event.js';
import { InventoryModifiedByGM } from './events/inventory-modified-by-gm.event.js';
import { MaxCapacityModified } from './events/max-capacity-modified.event.js';
import { InventoryItem, type InventoryItemData } from './inventory-item.js';
import { EquipmentSlotType } from './equipment-slot-type.js';
import { WeightCapacity } from './weight-capacity.js';
import { SlotIncompatibleException } from './exceptions/slot-incompatible.exception.js';
import { ItemNotFoundInInventoryException } from './exceptions/item-not-found-in-inventory.exception.js';
import { SlotAlreadyOccupiedException } from './exceptions/slot-already-occupied.exception.js';
import type { Clock } from '../../shared/clock.js';

export type InventoryEvent =
  | InventoryCreated
  | ItemAddedToInventory
  | ItemEquipped
  | ItemUnequipped
  | ItemMoved
  | ItemDropped
  | ItemRemovedFromInventory
  | InventoryModifiedByGM
  | MaxCapacityModified;

export class Inventory {
  private characterId = '';
  private campaignId = '';
  private equipmentSlots: Map<string, InventoryItem | null> = new Map();
  private backpackItems: Map<number, InventoryItem> = new Map();
  private weightCapacity: WeightCapacity = WeightCapacity.create(0, 0);
  private uncommittedEvents: InventoryEvent[] = [];

  private constructor() {}

  static create(
    characterId: string,
    campaignId: string,
    maxCapacity: number,
    clock: Clock,
  ): Inventory {
    const aggregate = new Inventory();

    const event = new InventoryCreated(
      characterId,
      campaignId,
      maxCapacity,
      clock.now().toISOString(),
    );

    aggregate.applyEvent(event);
    aggregate.uncommittedEvents.push(event);

    return aggregate;
  }

  addItem(item: InventoryItemData, clock: Clock): void {
    InventoryItem.create(item);

    const position = this.findNextBackpackPosition();

    const event = new ItemAddedToInventory(
      this.characterId,
      item,
      position,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  equipItem(itemId: string, toSlot: string, clock: Clock): void {
    const slotType = EquipmentSlotType.fromString(toSlot);

    const { item, position } = this.findBackpackItem(itemId);

    if (!item.canEquipTo(slotType.toString())) {
      throw SlotIncompatibleException.forItem(item.getName(), toSlot);
    }

    if (this.equipmentSlots.get(slotType.toString()) !== null) {
      throw SlotAlreadyOccupiedException.forSlot(toSlot);
    }

    const event = new ItemEquipped(
      this.characterId,
      itemId,
      position,
      toSlot,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  unequipItem(itemId: string, clock: Clock): void {
    const { slotType } = this.findEquippedItem(itemId);

    const targetPosition = this.findNextBackpackPosition();

    const event = new ItemUnequipped(
      this.characterId,
      itemId,
      slotType,
      targetPosition,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  moveItem(itemId: string, toPosition: number, clock: Clock): void {
    const { position: fromPosition } = this.findBackpackItem(itemId);

    if (fromPosition === toPosition) {
      return;
    }

    const event = new ItemMoved(
      this.characterId,
      itemId,
      fromPosition,
      toPosition,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  recordGmModification(
    gmId: string,
    modificationType: string,
    itemId: string,
    details: Record<string, unknown>,
    clock: Clock,
  ): void {
    const event = new InventoryModifiedByGM(
      this.characterId,
      gmId,
      modificationType,
      itemId,
      details,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  removeItem(itemId: string, clock: Clock): void {
    const fromSlot = this.findItemLocation(itemId);
    const item = this.findItemById(itemId);

    const event = new ItemRemovedFromInventory(
      this.characterId,
      itemId,
      item.getName(),
      item.getWeight(),
      fromSlot,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  modifyMaxCapacity(newMaxCapacity: number, modifiedBy: string, clock: Clock): void {
    if (newMaxCapacity < 0) {
      throw new Error('Max capacity cannot be negative.');
    }

    const previousMaxCapacity = this.weightCapacity.getMaxCapacity();

    const event = new MaxCapacityModified(
      this.characterId,
      previousMaxCapacity,
      newMaxCapacity,
      modifiedBy,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  dropItem(itemId: string, clock: Clock): void {
    const fromSlot = this.findItemLocation(itemId);
    const item = this.findItemById(itemId);

    const event = new ItemDropped(
      this.characterId,
      itemId,
      item.getName(),
      item.getWeight(),
      fromSlot,
      clock.now().toISOString(),
    );

    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }

  private findBackpackItem(itemId: string): {
    item: InventoryItem;
    position: number;
  } {
    for (const [position, item] of this.backpackItems) {
      if (item.getId() === itemId) {
        return { item, position };
      }
    }
    throw ItemNotFoundInInventoryException.forItem(itemId);
  }

  private findEquippedItem(itemId: string): {
    item: InventoryItem;
    slotType: string;
  } {
    for (const [slotType, item] of this.equipmentSlots) {
      if (item !== null && item.getId() === itemId) {
        return { item, slotType };
      }
    }
    throw ItemNotFoundInInventoryException.forItem(itemId);
  }

  private findItemById(itemId: string): InventoryItem {
    for (const [, item] of this.backpackItems) {
      if (item.getId() === itemId) {
        return item;
      }
    }
    for (const [, item] of this.equipmentSlots) {
      if (item !== null && item.getId() === itemId) {
        return item;
      }
    }
    throw ItemNotFoundInInventoryException.forItem(itemId);
  }

  private findItemLocation(itemId: string): string {
    for (const [position, item] of this.backpackItems) {
      if (item.getId() === itemId) {
        return `backpack:${position}`;
      }
    }
    for (const [slotType, item] of this.equipmentSlots) {
      if (item !== null && item.getId() === itemId) {
        return `equipment:${slotType}`;
      }
    }
    throw ItemNotFoundInInventoryException.forItem(itemId);
  }

  private findNextBackpackPosition(): number {
    let maxPosition = -1;
    for (const position of this.backpackItems.keys()) {
      if (position > maxPosition) {
        maxPosition = position;
      }
    }
    return maxPosition + 1;
  }

  private recalculateWeight(): void {
    let totalWeight = 0;
    for (const [, item] of this.backpackItems) {
      totalWeight += item.getWeight();
    }
    for (const [, item] of this.equipmentSlots) {
      if (item !== null) {
        totalWeight += item.getWeight();
      }
    }
    this.weightCapacity = this.weightCapacity.withWeight(totalWeight);
  }

  private initializeEquipmentSlots(): void {
    for (const slotType of EquipmentSlotType.ALLOWED_TYPES) {
      this.equipmentSlots.set(slotType, null);
    }
  }

  private applyEvent(event: InventoryEvent): void {
    if (event instanceof InventoryCreated) {
      this.characterId = event.characterId;
      this.campaignId = event.campaignId;
      this.weightCapacity = WeightCapacity.create(0, event.maxCapacity);
      this.initializeEquipmentSlots();
      this.backpackItems = new Map();
    } else if (event instanceof ItemAddedToInventory) {
      const item = InventoryItem.fromPrimitives(event.item);
      this.backpackItems.set(event.backpackPosition, item);
      this.recalculateWeight();
    } else if (event instanceof ItemEquipped) {
      const item = this.backpackItems.get(event.fromBackpackPosition);
      if (!item) {
        throw new Error(`Corrupted event stream: item not found at position ${event.fromBackpackPosition}`);
      }
      this.backpackItems.delete(event.fromBackpackPosition);
      this.equipmentSlots.set(event.toEquipmentSlot, item);
    } else if (event instanceof ItemUnequipped) {
      const item = this.equipmentSlots.get(event.fromEquipmentSlot);
      if (!item) {
        throw new Error(`Corrupted event stream: item not found at slot ${event.fromEquipmentSlot}`);
      }
      this.equipmentSlots.set(event.fromEquipmentSlot, null);
      this.backpackItems.set(event.toBackpackPosition, item);
    } else if (event instanceof ItemMoved) {
      const item = this.backpackItems.get(event.fromPosition);
      const targetItem = this.backpackItems.get(event.toPosition);
      if (item) {
        if (targetItem) {
          this.backpackItems.set(event.fromPosition, targetItem);
        } else {
          this.backpackItems.delete(event.fromPosition);
        }
        this.backpackItems.set(event.toPosition, item);
      }
    } else if (event instanceof ItemDropped) {
      if (event.fromSlot.startsWith('backpack:')) {
        const position = parseInt(event.fromSlot.split(':')[1], 10);
        this.backpackItems.delete(position);
      } else if (event.fromSlot.startsWith('equipment:')) {
        const slotType = event.fromSlot.split(':')[1];
        this.equipmentSlots.set(slotType, null);
      }
      this.recalculateWeight();
    } else if (event instanceof ItemRemovedFromInventory) {
      if (event.fromSlot.startsWith('backpack:')) {
        const position = parseInt(event.fromSlot.split(':')[1], 10);
        this.backpackItems.delete(position);
      } else if (event.fromSlot.startsWith('equipment:')) {
        const slotType = event.fromSlot.split(':')[1];
        this.equipmentSlots.set(slotType, null);
      }
      this.recalculateWeight();
    } else if (event instanceof InventoryModifiedByGM) {
      // No state change — this is a tracking/audit event
    } else if (event instanceof MaxCapacityModified) {
      this.weightCapacity = WeightCapacity.create(
        this.weightCapacity.getCurrentWeight(),
        event.newMaxCapacity,
      );
    }
  }

  static loadFromHistory(
    events: { type: string; data: Record<string, unknown> }[],
  ): Inventory {
    const aggregate = new Inventory();
    for (const event of events) {
      if (event.type === 'InventoryCreated') {
        const d = event.data;
        aggregate.applyEvent(
          new InventoryCreated(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'campaignId', event.type),
            aggregate.requireNumber(d, 'maxCapacity', event.type),
            aggregate.requireString(d, 'createdAt', event.type),
          ),
        );
      } else if (event.type === 'ItemAddedToInventory') {
        const d = event.data;
        aggregate.applyEvent(
          new ItemAddedToInventory(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireObject(d, 'item', event.type) as unknown as InventoryItemData,
            aggregate.requireNumber(d, 'backpackPosition', event.type),
            aggregate.requireString(d, 'addedAt', event.type),
          ),
        );
      } else if (event.type === 'ItemEquipped') {
        const d = event.data;
        aggregate.applyEvent(
          new ItemEquipped(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'itemId', event.type),
            aggregate.requireNumber(d, 'fromBackpackPosition', event.type),
            aggregate.requireString(d, 'toEquipmentSlot', event.type),
            aggregate.requireString(d, 'equippedAt', event.type),
          ),
        );
      } else if (event.type === 'ItemUnequipped') {
        const d = event.data;
        aggregate.applyEvent(
          new ItemUnequipped(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'itemId', event.type),
            aggregate.requireString(d, 'fromEquipmentSlot', event.type),
            aggregate.requireNumber(d, 'toBackpackPosition', event.type),
            aggregate.requireString(d, 'unequippedAt', event.type),
          ),
        );
      } else if (event.type === 'ItemMoved') {
        const d = event.data;
        aggregate.applyEvent(
          new ItemMoved(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'itemId', event.type),
            aggregate.requireNumber(d, 'fromPosition', event.type),
            aggregate.requireNumber(d, 'toPosition', event.type),
            aggregate.requireString(d, 'movedAt', event.type),
          ),
        );
      } else if (event.type === 'ItemDropped') {
        const d = event.data;
        aggregate.applyEvent(
          new ItemDropped(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'itemId', event.type),
            aggregate.requireString(d, 'itemName', event.type),
            aggregate.requireNumber(d, 'itemWeight', event.type),
            aggregate.requireString(d, 'fromSlot', event.type),
            aggregate.requireString(d, 'droppedAt', event.type),
          ),
        );
      } else if (event.type === 'ItemRemovedFromInventory') {
        const d = event.data;
        aggregate.applyEvent(
          new ItemRemovedFromInventory(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'itemId', event.type),
            aggregate.requireString(d, 'itemName', event.type),
            aggregate.requireNumber(d, 'itemWeight', event.type),
            aggregate.requireString(d, 'fromSlot', event.type),
            aggregate.requireString(d, 'removedAt', event.type),
          ),
        );
      } else if (event.type === 'InventoryModifiedByGM') {
        const d = event.data;
        aggregate.applyEvent(
          new InventoryModifiedByGM(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireString(d, 'gmId', event.type),
            aggregate.requireString(d, 'modificationType', event.type),
            aggregate.requireString(d, 'itemId', event.type),
            (d.details as Record<string, unknown>) ?? {},
            aggregate.requireString(d, 'modifiedAt', event.type),
          ),
        );
      } else if (event.type === 'MaxCapacityModified') {
        const d = event.data;
        aggregate.applyEvent(
          new MaxCapacityModified(
            aggregate.requireString(d, 'characterId', event.type),
            aggregate.requireNumber(d, 'previousMaxCapacity', event.type),
            aggregate.requireNumber(d, 'newMaxCapacity', event.type),
            aggregate.requireString(d, 'modifiedBy', event.type),
            aggregate.requireString(d, 'modifiedAt', event.type),
          ),
        );
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
    }
    return aggregate;
  }

  getUncommittedEvents(): InventoryEvent[] {
    return [...this.uncommittedEvents];
  }

  clearEvents(): void {
    this.uncommittedEvents = [];
  }

  getCharacterId(): string {
    return this.characterId;
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getEquipmentSlots(): Map<string, InventoryItem | null> {
    return new Map(this.equipmentSlots);
  }

  getBackpackItems(): Map<number, InventoryItem> {
    return new Map(this.backpackItems);
  }

  getWeightCapacity(): WeightCapacity {
    return this.weightCapacity;
  }

  isOverencumbered(): boolean {
    return this.weightCapacity.isOverencumbered();
  }

  private requireString(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): string {
    const value = data[field];
    if (typeof value !== 'string') {
      throw new Error(
        `Invalid event data: "${field}" must be a string in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }

  private requireNumber(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): number {
    const value = data[field];
    if (typeof value !== 'number') {
      throw new Error(
        `Invalid event data: "${field}" must be a number in ${eventType}, got ${typeof value}`,
      );
    }
    return value;
  }

  private requireObject(
    data: Record<string, unknown>,
    field: string,
    eventType: string,
  ): Record<string, unknown> {
    const value = data[field];
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(
        `Invalid event data: "${field}" must be an object in ${eventType}, got ${typeof value}`,
      );
    }
    return value as Record<string, unknown>;
  }
}
