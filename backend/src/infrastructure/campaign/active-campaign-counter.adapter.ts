import { Injectable } from '@nestjs/common';
import { CampaignStatusEnum } from '@prisma/client';
import { ActiveCampaignCounter } from '../../campaign/campaign/active-campaign-counter.port.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class ActiveCampaignCounterAdapter implements ActiveCampaignCounter {
  constructor(private readonly prisma: PrismaService) {}

  async countByGmUserId(userId: string): Promise<number> {
    return this.prisma.campaign.count({
      where: {
        gmUserId: userId,
        status: { not: CampaignStatusEnum.archived },
      },
    });
  }
}
