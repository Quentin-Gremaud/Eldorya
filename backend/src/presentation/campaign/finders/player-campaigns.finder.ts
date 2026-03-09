import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { PlayerCampaignDto } from '../dto/player-campaign.dto.js';
import { resolveGmDisplayName } from './gm-display-name.util.js';

@Injectable()
export class PlayerCampaignsFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findPlayerCampaigns(userId: string): Promise<PlayerCampaignDto[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        members: {
          some: {
            userId,
            role: 'player',
          },
        },
      },
      orderBy: [
        { lastSessionDate: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    });

    if (campaigns.length === 0) return [];

    const gmUserIds = [...new Set(campaigns.map((c) => c.gmUserId))];
    const gmUsers = await this.prisma.user.findMany({
      where: { id: { in: gmUserIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const gmUserMap = new Map(gmUsers.map((u) => [u.id, u]));

    return campaigns.map((campaign) => {
      const gmDisplayName = resolveGmDisplayName(
        gmUserMap.get(campaign.gmUserId) ?? null,
      );

      return new PlayerCampaignDto({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        coverImageUrl: campaign.coverImageUrl,
        status: campaign.status,
        gmDisplayName,
        playerCount: campaign.playerCount,
        lastSessionDate: campaign.lastSessionDate,
      });
    });
  }
}
