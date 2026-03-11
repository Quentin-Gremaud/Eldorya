import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface FogZoneResult {
  id: string;
  mapLevelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  revealedAt: string;
}

@Injectable()
export class FogStateFinder {
  constructor(private readonly prisma: PrismaService) {}

  async checkGmAccess(
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

  async checkPlayerInCampaign(
    campaignId: string,
    playerId: string,
  ): Promise<void> {
    const member = await this.prisma.campaignMember.findFirst({
      where: { campaignId, userId: playerId, role: 'player' },
    });

    if (!member) throw new NotFoundException('Player not found in campaign');
  }

  async checkPlayerOrGmAccess(
    campaignId: string,
    playerId: string,
    userId: string,
  ): Promise<void> {
    if (userId === playerId) return;

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { gmUserId: true },
    });

    if (!campaign) throw new NotFoundException();
    if (campaign.gmUserId !== userId) throw new ForbiddenException();
  }

  async findRevealedZones(
    campaignId: string,
    mapLevelId: string,
    playerId: string,
  ): Promise<FogZoneResult[]> {
    const fogState = await this.prisma.fogState.findUnique({
      where: {
        campaignId_playerId_mapLevelId: { campaignId, playerId, mapLevelId },
      },
    });

    if (!fogState) {
      return [];
    }

    return fogState.revealedZones as FogZoneResult[];
  }
}
