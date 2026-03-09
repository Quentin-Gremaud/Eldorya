import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface CharacterDetailResult {
  id: string;
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
  rejectionReason: string | null;
  createdAt: Date;
}

@Injectable()
export class CharacterDetailFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndCampaign(
    userId: string,
    campaignId: string,
  ): Promise<CharacterDetailResult | null> {
    const character = await this.prisma.character.findFirst({
      where: { userId, campaignId },
    });

    if (!character) return null;

    return {
      id: character.id,
      name: character.name,
      race: character.race,
      characterClass: character.characterClass,
      background: character.background,
      stats: character.stats as {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
      },
      spells: character.spells,
      status: character.status,
      rejectionReason: character.rejectionReason,
      createdAt: character.createdAt,
    };
  }
}
