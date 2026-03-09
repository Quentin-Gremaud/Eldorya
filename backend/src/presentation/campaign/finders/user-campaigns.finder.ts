import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { CampaignSummaryDto } from '../dto/campaign-summary.dto.js';

@Injectable()
export class UserCampaignsFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(
    userId: string,
    limit = 50,
  ): Promise<CampaignSummaryDto[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        OR: [{ gmUserId: userId }, { members: { some: { userId } } }],
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return campaigns.map((campaign) => {
      const memberRole = campaign.members[0]?.role;
      const role: 'gm' | 'player' =
        campaign.gmUserId === userId
          ? 'gm'
          : ((memberRole as 'gm' | 'player') ?? 'player');

      return new CampaignSummaryDto({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        coverImageUrl: campaign.coverImageUrl,
        status: campaign.status,
        role,
        playerCount: campaign.playerCount,
        lastSessionDate: campaign.lastSessionDate,
        createdAt: campaign.createdAt,
      });
    });
  }
}
