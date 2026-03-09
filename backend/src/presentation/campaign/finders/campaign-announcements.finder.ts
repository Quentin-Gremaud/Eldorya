import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface AnnouncementItem {
  id: string;
  content: string;
  gmDisplayName: string;
  createdAt: Date;
}

export interface CampaignAnnouncementsResult {
  announcements: AnnouncementItem[];
  totalCount: number;
}

export type CampaignMembershipCheck =
  | { exists: false }
  | { exists: true; isMember: boolean; isGm: boolean };

@Injectable()
export class CampaignAnnouncementsFinder {
  private static readonly DEFAULT_LIMIT = 50;

  constructor(private readonly prisma: PrismaService) {}

  async checkCampaignMembership(
    campaignId: string,
    userId: string,
  ): Promise<CampaignMembershipCheck> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        gmUserId: true,
        members: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!campaign) return { exists: false };

    const isGm = campaign.gmUserId === userId;
    const isMember = isGm || campaign.members.length > 0;
    return { exists: true, isMember, isGm };
  }

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

  async findByCampaignId(
    campaignId: string,
    limit: number = CampaignAnnouncementsFinder.DEFAULT_LIMIT,
  ): Promise<CampaignAnnouncementsResult> {
    const [announcements, totalCount] = await Promise.all([
      this.prisma.campaignAnnouncement.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          gmDisplayName: true,
          createdAt: true,
        },
      }),
      this.prisma.campaignAnnouncement.count({
        where: { campaignId },
      }),
    ]);

    return { announcements, totalCount };
  }
}
