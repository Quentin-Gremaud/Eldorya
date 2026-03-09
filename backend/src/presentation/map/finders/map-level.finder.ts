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

  async checkMapLevelExists(
    campaignId: string,
    mapLevelId: string,
  ): Promise<void> {
    const mapLevel = await this.prisma.mapLevel.findFirst({
      where: { id: mapLevelId, campaignId },
      select: { id: true },
    });

    if (!mapLevel) throw new NotFoundException('Map level not found');
  }

  async checkCampaignAccess(
    campaignId: string,
    userId: string,
  ): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        gmUserId: true,
        members: { where: { userId }, select: { id: true } },
      },
    });

    if (!campaign) throw new NotFoundException();

    const isGm = campaign.gmUserId === userId;
    const isMember = campaign.members.length > 0;
    if (!isGm && !isMember) throw new ForbiddenException();
  }
}
