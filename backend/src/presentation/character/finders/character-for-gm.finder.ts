import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface CharacterDetailForGm {
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
  createdAt: Date;
}

@Injectable()
export class CharacterForGmFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdAndCampaign(
    characterId: string,
    campaignId: string,
  ): Promise<CharacterDetailForGm | null> {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, campaignId },
    });

    if (!character) return null;

    return {
      id: character.id,
      userId: character.userId,
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
      createdAt: character.createdAt,
    };
  }
}
