import { Injectable } from '@nestjs/common';
import { CharacterStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface PendingCharacterDetail {
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
  createdAt: string;
}

@Injectable()
export class PendingCharactersFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByCampaignId(
    campaignId: string,
  ): Promise<PendingCharacterDetail[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        campaignId,
        status: CharacterStatusEnum.pending,
      },
      orderBy: { createdAt: 'asc' },
    });

    return characters.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      race: c.race,
      characterClass: c.characterClass,
      background: c.background,
      stats: c.stats as PendingCharacterDetail['stats'],
      spells: c.spells,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));
  }
}
