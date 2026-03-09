import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface InvitationReadModel {
  id: string;
  tokenHash: string;
  campaignId: string;
  campaignName: string;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class InvitationFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(
    tokenHash: string,
  ): Promise<InvitationReadModel | null> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { campaign: { select: { name: true } } },
    });

    if (!invitation) return null;

    return {
      id: invitation.id,
      tokenHash: invitation.tokenHash,
      campaignId: invitation.campaignId,
      campaignName: invitation.campaign.name,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  async findActiveByCampaignId(
    campaignId: string,
  ): Promise<InvitationReadModel | null> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { campaignId, status: 'active' },
      include: { campaign: { select: { name: true } } },
    });

    if (!invitation) return null;

    return {
      id: invitation.id,
      tokenHash: invitation.tokenHash,
      campaignId: invitation.campaignId,
      campaignName: invitation.campaign.name,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  async findActiveByTokenHash(
    tokenHash: string,
  ): Promise<InvitationReadModel | null> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { tokenHash, status: 'active' },
      include: { campaign: { select: { name: true } } },
    });

    if (!invitation) return null;

    return {
      id: invitation.id,
      tokenHash: invitation.tokenHash,
      campaignId: invitation.campaignId,
      campaignName: invitation.campaign.name,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}
