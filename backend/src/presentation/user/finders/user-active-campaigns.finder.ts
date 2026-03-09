import { Injectable } from '@nestjs/common';
import { CampaignStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface ActiveCampaignResult {
  id: string;
  name: string;
}

@Injectable()
export class UserActiveCampaignsFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByGmUserId(
    userId: string,
  ): Promise<{ count: number; campaigns: ActiveCampaignResult[] }> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        gmUserId: userId,
        status: CampaignStatusEnum.active,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      count: campaigns.length,
      campaigns,
    };
  }
}
