import { Injectable } from '@nestjs/common';
import { CharacterStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface PendingModificationDetail {
  id: string;
  userId: string;
  name: string;
  race: string;
  characterClass: string;
  background: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  spells: string[];
  status: string;
  proposedChanges: Record<string, { current: unknown; proposed: unknown }>;
  createdAt: string;
}

@Injectable()
export class PendingModificationsFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByCampaignId(
    campaignId: string,
  ): Promise<PendingModificationDetail[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        campaignId,
        status: CharacterStatusEnum.pending_revalidation,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return characters
      .filter((c) => c.proposedChanges !== null)
      .map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        race: c.race,
        characterClass: c.characterClass,
        background: c.background,
        stats: c.stats as PendingModificationDetail['stats'],
        spells: c.spells,
        status: c.status,
        proposedChanges: c.proposedChanges as PendingModificationDetail['proposedChanges'],
        createdAt: c.createdAt.toISOString(),
      }));
  }
}
