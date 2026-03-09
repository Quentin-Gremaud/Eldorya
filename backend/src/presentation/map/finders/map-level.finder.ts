import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class MapLevelFinder {
  constructor(private readonly prisma: PrismaService) {}

  async checkGmOwnership(
    campaignId: string,
    userId: string,
  ): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { gmUserId: true },
    });

    if (!campaign) throw new NotFoundException();
    if (campaign.gmUserId !== userId) throw new ForbiddenException();
  }
}
