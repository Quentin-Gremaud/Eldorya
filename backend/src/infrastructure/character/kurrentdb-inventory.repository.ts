import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { InventoryRepository } from '../../character/inventory/inventory.repository.js';
import {
  Inventory,
  type InventoryEvent,
} from '../../character/inventory/inventory.aggregate.js';
import { InventoryCreated } from '../../character/inventory/events/inventory-created.event.js';
import { ItemAddedToInventory } from '../../character/inventory/events/item-added-to-inventory.event.js';
import { ItemEquipped } from '../../character/inventory/events/item-equipped.event.js';
import { ItemUnequipped } from '../../character/inventory/events/item-unequipped.event.js';
import { ItemMoved } from '../../character/inventory/events/item-moved.event.js';
import { ItemDropped } from '../../character/inventory/events/item-dropped.event.js';
import { ItemRemovedFromInventory } from '../../character/inventory/events/item-removed-from-inventory.event.js';
import { InventoryModifiedByGM } from '../../character/inventory/events/inventory-modified-by-gm.event.js';
import { MaxCapacityModified } from '../../character/inventory/events/max-capacity-modified.event.js';
import { KurrentDbService } from '../eventstore/kurrentdb.service.js';
import type { Clock } from '../../shared/clock.js';
import { CLOCK } from '../../shared/clock.js';

@Injectable()
export class KurrentDbInventoryRepository implements InventoryRepository {
  constructor(
    private readonly kurrentDb: KurrentDbService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async saveNew(inventory: Inventory): Promise<void> {
    const characterId = inventory.getCharacterId();
    const streamName = `inventory-${characterId}`;
    const events = inventory.getUncommittedEvents();
    const correlationId = randomUUID();

    const allEvents = events.map((event) => ({
      eventType: event.type,
      data: this.toEventData(event),
      metadata: {
        correlationId,
        timestamp: this.clock.now().toISOString(),
        characterId,
        campaignId: inventory.getCampaignId(),
      },
    }));

    await this.kurrentDb.appendEventsToNewStream(streamName, allEvents);

    inventory.clearEvents();
  }

  async save(inventory: Inventory): Promise<void> {
    const characterId = inventory.getCharacterId();
    const streamName = `inventory-${characterId}`;
    const events = inventory.getUncommittedEvents();
    const correlationId = randomUUID();

    for (const event of events) {
      await this.kurrentDb.appendToStream(
        streamName,
        event.type,
        this.toEventData(event),
        {
          correlationId,
          timestamp: this.clock.now().toISOString(),
          characterId,
          campaignId: inventory.getCampaignId(),
        },
      );
    }

    inventory.clearEvents();
  }

  async load(characterId: string): Promise<Inventory> {
    const events = await this.kurrentDb.readStream(
      `inventory-${characterId}`,
    );
    return Inventory.loadFromHistory(events);
  }

  private toEventData(event: InventoryEvent): Record<string, unknown> {
    if (event instanceof InventoryCreated) {
      return {
        characterId: event.characterId,
        campaignId: event.campaignId,
        maxCapacity: event.maxCapacity,
        createdAt: event.createdAt,
      };
    }
    if (event instanceof ItemAddedToInventory) {
      return {
        characterId: event.characterId,
        item: event.item,
        backpackPosition: event.backpackPosition,
        addedAt: event.addedAt,
      };
    }
    if (event instanceof ItemEquipped) {
      return {
        characterId: event.characterId,
        itemId: event.itemId,
        fromBackpackPosition: event.fromBackpackPosition,
        toEquipmentSlot: event.toEquipmentSlot,
        equippedAt: event.equippedAt,
      };
    }
    if (event instanceof ItemUnequipped) {
      return {
        characterId: event.characterId,
        itemId: event.itemId,
        fromEquipmentSlot: event.fromEquipmentSlot,
        toBackpackPosition: event.toBackpackPosition,
        unequippedAt: event.unequippedAt,
      };
    }
    if (event instanceof ItemMoved) {
      return {
        characterId: event.characterId,
        itemId: event.itemId,
        fromPosition: event.fromPosition,
        toPosition: event.toPosition,
        movedAt: event.movedAt,
      };
    }
    if (event instanceof ItemDropped) {
      return {
        characterId: event.characterId,
        itemId: event.itemId,
        itemName: event.itemName,
        itemWeight: event.itemWeight,
        fromSlot: event.fromSlot,
        droppedAt: event.droppedAt,
      };
    }
    if (event instanceof ItemRemovedFromInventory) {
      return {
        characterId: event.characterId,
        itemId: event.itemId,
        itemName: event.itemName,
        itemWeight: event.itemWeight,
        fromSlot: event.fromSlot,
        removedAt: event.removedAt,
      };
    }
    if (event instanceof InventoryModifiedByGM) {
      return {
        characterId: event.characterId,
        gmId: event.gmId,
        modificationType: event.modificationType,
        itemId: event.itemId,
        details: event.details,
        modifiedAt: event.modifiedAt,
      };
    }
    if (event instanceof MaxCapacityModified) {
      return {
        characterId: event.characterId,
        previousMaxCapacity: event.previousMaxCapacity,
        newMaxCapacity: event.newMaxCapacity,
        modifiedBy: event.modifiedBy,
        modifiedAt: event.modifiedAt,
      };
    }
    const _exhaustive: never = event;
    throw new Error('Unknown inventory event type');
  }
}
