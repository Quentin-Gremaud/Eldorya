import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { CampaignMembershipChecker } from '../../session/action-pipeline/campaign-membership-checker.port.js';

@Injectable()
export class PrismaCampaignMembershipChecker implements CampaignMembershipChecker {
  constructor(private readonly prisma: PrismaService) {}

  async isMember(campaignId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.campaignMember.findFirst({
      where: { campaignId, userId },
    });
    return member !== null;
  }
}
