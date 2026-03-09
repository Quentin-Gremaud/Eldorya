import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { resolveGmDisplayName } from './gm-display-name.util.js';

export interface CampaignDetailResult {
  campaign: {
    id: string;
    name: string;
    description: string | null;
    coverImageUrl: string | null;
    status: string;
    gmUserId: string;
    playerCount: number;
    lastSessionDate: Date | null;
    createdAt: Date;
  };
  membership: { role: string } | null;
  gmDisplayName: string;
}

@Injectable()
export class CampaignDetailFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    campaignId: string,
  ): Promise<{ id: string; gmUserId: string } | null> {
    return this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, gmUserId: true },
    });
  }

  async findCampaignDetail(
    campaignId: string,
    userId: string,
  ): Promise<CampaignDetailResult | null> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!campaign) return null;

    const gmUser = await this.prisma.user.findUnique({
      where: { id: campaign.gmUserId },
      select: { firstName: true, lastName: true, email: true },
    });

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        coverImageUrl: campaign.coverImageUrl,
        status: campaign.status,
        gmUserId: campaign.gmUserId,
        playerCount: campaign.playerCount,
        lastSessionDate: campaign.lastSessionDate,
        createdAt: campaign.createdAt,
      },
      membership: campaign.members[0] ?? null,
      gmDisplayName: resolveGmDisplayName(gmUser),
    };
  }
}
