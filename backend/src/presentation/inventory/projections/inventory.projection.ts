import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { START, eventTypeFilter } from '@kurrent/kurrentdb-client';
import { KurrentDbService } from '../../../infrastructure/eventstore/kurrentdb.service.js';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

interface InventoryItemData {
  id: string;
  name: string;
  description: string;
  weight: number;
  slotType: string;
  statModifiers: Record<string, number>;
}

@Injectable()
export class InventoryProjection implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InventoryProjection.name);
  private abortController: AbortController | null = null;

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    void this.startSubscription();
  }

  onModuleDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async startSubscription() {
    this.abortController = new AbortController();

    try {
      const client = this.kurrentDb.getClient();

      const checkpoint = await this.prisma.projectionCheckpoint.findUnique({
        where: { projectionName: 'InventoryProjection' },
      });

      const fromPosition = checkpoint
        ? {
            commit: BigInt(checkpoint.commitPosition),
            prepare: BigInt(checkpoint.preparePosition),
          }
        : START;

      const subscription = client.subscribeToAll({
        fromPosition,
        filter: eventTypeFilter({
          prefixes: [
            'InventoryCreated',
            'ItemAddedToInventory',
            'ItemEquipped',
            'ItemUnequipped',
            'ItemMoved',
            'ItemDropped',
            'ItemRemovedFromInventory',
            'InventoryModifiedByGM',
            'MaxCapacityModified',
            'CharacterApproved',
          ],
        }),
      });

      this.logger.log(
        `Inventory projection catch-up subscription started from ${checkpoint ? `position ${checkpoint.commitPosition}` : 'START'}`,
      );

      for await (const resolvedEvent of subscription) {
        if (this.abortController.signal.aborted) break;
        if (!resolvedEvent.event) continue;

        try {
          const eventType = resolvedEvent.event.type;
          const data = resolvedEvent.event.data as Record<string, unknown>;

          if (eventType === 'CharacterApproved') {
            await this.handleCharacterApproved(data);
          } else if (eventType === 'InventoryCreated') {
            await this.handleInventoryCreated(data);
          } else if (eventType === 'ItemAddedToInventory') {
            await this.handleItemAddedToInventory(data);
          } else if (eventType === 'ItemEquipped') {
            await this.handleItemEquipped(data);
          } else if (eventType === 'ItemUnequipped') {
            await this.handleItemUnequipped(data);
          } else if (eventType === 'ItemMoved') {
            await this.handleItemMoved(data);
          } else if (eventType === 'ItemDropped') {
            await this.handleItemDropped(data);
          } else if (eventType === 'ItemRemovedFromInventory') {
            await this.handleItemRemovedFromInventory(data);
          } else if (eventType === 'InventoryModifiedByGM') {
            this.logger.log(
              `GM modification recorded for character ${data.characterId}, type: ${data.modificationType}`,
            );
          } else if (eventType === 'MaxCapacityModified') {
            await this.handleMaxCapacityModified(data);
          }

          const position = resolvedEvent.event?.position;
          if (position) {
            await this.prisma.projectionCheckpoint.upsert({
              where: { projectionName: 'InventoryProjection' },
              create: {
                projectionName: 'InventoryProjection',
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
              },
              update: {
                commitPosition: String(position.commit),
                preparePosition: String(position.prepare),
              },
            });
          }
        } catch (err) {
          this.logger.error(
            `Error projecting event ${resolvedEvent.event.id}`,
            err instanceof Error ? err.stack : String(err),
          );
        }
      }
    } catch (err) {
      if (this.abortController?.signal.aborted) return;
      this.logger.error(
        'Inventory projection subscription error — will retry in 5s',
        err instanceof Error ? err.stack : String(err),
      );
      setTimeout(() => {
        if (!this.abortController?.signal.aborted) {
          void this.startSubscription();
        }
      }, 5000);
    }
  }

  private async handleCharacterApproved(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { campaignId: true },
    });

    if (!character) return;

    const existing = await this.prisma.inventory.findUnique({
      where: { characterId },
    });

    if (existing) return;

    await this.prisma.inventory.create({
      data: {
        characterId,
        campaignId: character.campaignId,
        equipmentSlots: {
          head: null,
          torso: null,
          hands: null,
          legs: null,
          feet: null,
          ring1: null,
          ring2: null,
          weapon_shield: null,
        },
        backpackItems: [],
        currentWeight: 0,
        maxCapacity: 20,
      },
    });

    this.logger.log(
      `Empty inventory created for approved character ${characterId}`,
    );
  }

  private async handleInventoryCreated(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const campaignId = data.campaignId as string;
    const maxCapacity = data.maxCapacity as number;

    await this.prisma.inventory.upsert({
      where: { characterId },
      create: {
        characterId,
        campaignId,
        equipmentSlots: {
          head: null,
          torso: null,
          hands: null,
          legs: null,
          feet: null,
          ring1: null,
          ring2: null,
          weapon_shield: null,
        },
        backpackItems: [],
        currentWeight: 0,
        maxCapacity,
      },
      update: {
        maxCapacity,
      },
    });

    this.logger.log(`Inventory created for character ${characterId}`);
  }

  private async handleItemAddedToInventory(
    data: Record<string, unknown>,
  ): Promise<void> {
    const characterId = data.characterId as string;
    const itemData = data.item as InventoryItemData;
    const backpackPosition = data.backpackPosition as number;

    const inventory = await this.prisma.inventory.findUnique({
      where: { characterId },
    });

    if (!inventory) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.upsert({
        where: { id: itemData.id },
        create: {
          id: itemData.id,
          inventoryId: inventory.id,
          name: itemData.name,
          description: itemData.description,
          weight: itemData.weight,
          slotType: itemData.slotType,
          statModifiers: itemData.statModifiers,
          position: backpackPosition,
          equippedSlot: null,
        },
        update: {
          position: backpackPosition,
          equippedSlot: null,
        },
      });

      const allItems = await tx.inventoryItem.findMany({
        where: { inventoryId: inventory.id },
      });

      const totalWeight = allItems.reduce((sum, item) => sum + item.weight, 0);
      const backpackItems = allItems
        .filter((i) => i.equippedSlot === null)
        .map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          weight: i.weight,
          slotType: i.slotType,
          statModifiers: i.statModifiers,
          position: i.position,
        }));

      await tx.inventory.update({
        where: { characterId },
        data: {
          currentWeight: totalWeight,
          backpackItems,
        },
      });
    });

    this.logger.log(
      `Item ${itemData.name} added to inventory for character ${characterId}`,
    );
  }

  private async handleItemEquipped(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const itemId = data.itemId as string;
    const toEquipmentSlot = data.toEquipmentSlot as string;

    const inventory = await this.prisma.inventory.findUnique({
      where: { characterId },
    });

    if (!inventory) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          equippedSlot: toEquipmentSlot,
          position: null,
        },
      });

      await this.rebuildInventoryJsonFields(tx, characterId, inventory.id);
    });

    this.logger.log(
      `Item ${itemId} equipped to ${toEquipmentSlot} for character ${characterId}`,
    );
  }

  private async handleItemUnequipped(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const itemId = data.itemId as string;
    const toBackpackPosition = data.toBackpackPosition as number;

    const inventory = await this.prisma.inventory.findUnique({
      where: { characterId },
    });

    if (!inventory) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          equippedSlot: null,
          position: toBackpackPosition,
        },
      });

      await this.rebuildInventoryJsonFields(tx, characterId, inventory.id);
    });

    this.logger.log(
      `Item ${itemId} unequipped for character ${characterId}`,
    );
  }

  private async handleItemMoved(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const itemId = data.itemId as string;
    const fromPosition = data.fromPosition as number;
    const toPosition = data.toPosition as number;

    const inventory = await this.prisma.inventory.findUnique({
      where: { characterId },
    });

    if (!inventory) return;

    await this.prisma.$transaction(async (tx) => {
      const targetItem = await tx.inventoryItem.findFirst({
        where: {
          inventoryId: inventory.id,
          position: toPosition,
          equippedSlot: null,
        },
      });

      if (targetItem) {
        await tx.inventoryItem.update({
          where: { id: targetItem.id },
          data: { position: fromPosition },
        });
      }

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { position: toPosition },
      });

      await this.rebuildInventoryJsonFields(tx, characterId, inventory.id);
    });

    this.logger.log(
      `Item ${itemId} moved from position ${fromPosition} to ${toPosition} for character ${characterId}`,
    );
  }

  private async handleItemDropped(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const itemId = data.itemId as string;

    const inventory = await this.prisma.inventory.findUnique({
      where: { characterId },
    });

    if (!inventory) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.delete({
        where: { id: itemId },
      });

      await this.rebuildInventoryJsonFields(tx, characterId, inventory.id);
    });

    this.logger.log(
      `Item ${itemId} dropped from inventory for character ${characterId}`,
    );
  }

  private async handleItemRemovedFromInventory(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const itemId = data.itemId as string;

    const inventory = await this.prisma.inventory.findUnique({
      where: { characterId },
    });

    if (!inventory) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.delete({
        where: { id: itemId },
      });

      await this.rebuildInventoryJsonFields(tx, characterId, inventory.id);
    });

    this.logger.log(
      `Item ${itemId} removed from inventory for character ${characterId}`,
    );
  }

  private async handleMaxCapacityModified(data: Record<string, unknown>): Promise<void> {
    const characterId = data.characterId as string;
    const newMaxCapacity = data.newMaxCapacity as number;

    await this.prisma.inventory.update({
      where: { characterId },
      data: { maxCapacity: newMaxCapacity },
    });

    this.logger.log(
      `Max capacity modified to ${newMaxCapacity} for character ${characterId}`,
    );
  }

  private async rebuildInventoryJsonFields(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    characterId: string,
    inventoryId: string,
  ): Promise<void> {
    const allItems = await tx.inventoryItem.findMany({
      where: { inventoryId },
    });

    const totalWeight = allItems.reduce((sum, item) => sum + item.weight, 0);

    const equipmentSlots: Record<string, unknown> = {
      head: null,
      torso: null,
      hands: null,
      legs: null,
      feet: null,
      ring1: null,
      ring2: null,
      weapon_shield: null,
    };

    const backpackItems: unknown[] = [];

    for (const item of allItems) {
      const itemSummary = {
        id: item.id,
        name: item.name,
        description: item.description,
        weight: item.weight,
        slotType: item.slotType,
        statModifiers: item.statModifiers,
      };

      if (item.equippedSlot) {
        equipmentSlots[item.equippedSlot] = itemSummary;
      } else {
        backpackItems.push({
          ...itemSummary,
          position: item.position,
        });
      }
    }

    await tx.inventory.update({
      where: { characterId },
      data: {
        equipmentSlots: equipmentSlots as unknown as Prisma.InputJsonValue,
        backpackItems: backpackItems as unknown as Prisma.InputJsonValue,
        currentWeight: totalWeight,
      },
    });
  }
}
