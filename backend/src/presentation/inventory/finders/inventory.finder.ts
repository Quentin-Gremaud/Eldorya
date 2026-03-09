import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface InventoryItemResult {
  id: string;
  name: string;
  description: string;
  weight: number;
  slotType: string;
  statModifiers: Record<string, number>;
  position: number | null;
  equippedSlot: string | null;
}

export interface InventoryResult {
  characterId: string;
  campaignId: string;
  equipmentSlots: Record<string, unknown>;
  backpackItems: unknown[];
  currentWeight: number;
  maxCapacity: number;
  items: InventoryItemResult[];
}

@Injectable()
export class InventoryFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByCharacterId(
    characterId: string,
    userId: string,
  ): Promise<InventoryResult | null> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { userId: true, campaignId: true },
    });

    if (!character) return null;

    if (character.userId !== userId) {
      throw new ForbiddenException('You do not own this character.');
    }

    const inventory = await this.prisma.inventory.findUnique({
      where: { characterId },
      include: { items: true },
    });

    if (!inventory) return null;

    return {
      characterId: inventory.characterId,
      campaignId: inventory.campaignId,
      equipmentSlots: inventory.equipmentSlots as Record<string, unknown>,
      backpackItems: inventory.backpackItems as unknown[],
      currentWeight: inventory.currentWeight,
      maxCapacity: inventory.maxCapacity,
      items: inventory.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        weight: item.weight,
        slotType: item.slotType,
        statModifiers: item.statModifiers as Record<string, number>,
        position: item.position,
        equippedSlot: item.equippedSlot,
      })),
    };
  }

  async verifyCharacterOwnership(
    characterId: string,
    userId: string,
    campaignId: string,
  ): Promise<void> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { userId: true, campaignId: true },
    });

    if (!character) {
      throw new NotFoundException('Character not found.');
    }

    if (character.campaignId !== campaignId) {
      throw new NotFoundException('Character not found.');
    }

    if (character.userId !== userId) {
      throw new ForbiddenException('You do not own this character.');
    }
  }
}
