import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class InventoryGmFinder {
  constructor(private readonly prisma: PrismaService) {}

  async verifyGmOwnership(
    characterId: string,
    campaignId: string,
    userId: string,
  ): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { gmUserId: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    if (campaign.gmUserId !== userId) {
      throw new ForbiddenException('Only the GM can modify this inventory.');
    }

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { campaignId: true },
    });

    if (!character) {
      throw new NotFoundException('Character not found.');
    }

    if (character.campaignId !== campaignId) {
      throw new NotFoundException('Character not found in this campaign.');
    }
  }
}
