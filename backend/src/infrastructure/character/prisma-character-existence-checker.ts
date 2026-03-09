import { Injectable } from '@nestjs/common';
import type { CharacterExistenceChecker } from '../../character/character/character-existence-checker.port.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PrismaCharacterExistenceChecker
  implements CharacterExistenceChecker
{
  constructor(private readonly prisma: PrismaService) {}

  async exists(campaignId: string, userId: string): Promise<boolean> {
    const character = await this.prisma.character.findFirst({
      where: { campaignId, userId },
      select: { id: true },
    });
    return character !== null;
  }
}
