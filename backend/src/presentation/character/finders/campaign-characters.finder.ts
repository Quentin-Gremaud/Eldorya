import { Injectable } from '@nestjs/common';
import { CharacterStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface CharacterSummary {
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
export class CampaignCharactersFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findApprovedByCampaignId(
    campaignId: string,
  ): Promise<CharacterSummary[]> {
    const characters = await this.prisma.character.findMany({
      where: {
        campaignId,
        status: CharacterStatusEnum.approved,
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
      stats: c.stats as CharacterSummary['stats'],
      spells: c.spells,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    }));
  }
}
