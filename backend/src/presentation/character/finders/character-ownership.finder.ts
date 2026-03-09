import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class CharacterOwnershipFinder {
  constructor(private readonly prisma: PrismaService) {}

  async verifyOwnership(
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
