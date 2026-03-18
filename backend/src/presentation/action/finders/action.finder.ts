import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface PendingActionResult {
  id: string;
  sessionId: string;
  campaignId: string;
  playerId: string;
  actionType: string;
  description: string;
  target: string | null;
  status: string;
  proposedAt: string;
}

export interface ResolvedActionResult {
  id: string;
  sessionId: string;
  campaignId: string;
  playerId: string;
  actionType: string;
  description: string;
  target: string | null;
  status: string;
  narrativeNote: string | null;
  feedback: string | null;
  proposedAt: string;
  resolvedAt: string | null;
}

export interface PingStatusResult {
  playerId: string;
  pingedAt: string;
}

@Injectable()
export class ActionFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingActionsBySession(
    sessionId: string,
    campaignId: string,
  ): Promise<PendingActionResult[]> {
    const actions = await this.prisma.sessionAction.findMany({
      where: { sessionId, campaignId, status: 'pending' },
      orderBy: { queuePosition: 'asc' },
    });

    return actions.map((a) => ({
      id: a.id,
      sessionId: a.sessionId,
      campaignId: a.campaignId,
      playerId: a.playerId,
      actionType: a.actionType,
      description: a.description,
      target: a.target,
      status: a.status,
      proposedAt: a.proposedAt.toISOString(),
    }));
  }

  async findResolvedActionsBySession(
    sessionId: string,
    campaignId: string,
  ): Promise<ResolvedActionResult[]> {
    const actions = await this.prisma.sessionAction.findMany({
      where: {
        sessionId,
        campaignId,
        status: { in: ['validated', 'rejected'] },
      },
      orderBy: { resolvedAt: 'desc' },
    });

    return actions.map((a) => ({
      id: a.id,
      sessionId: a.sessionId,
      campaignId: a.campaignId,
      playerId: a.playerId,
      actionType: a.actionType,
      description: a.description,
      target: a.target,
      status: a.status,
      narrativeNote: a.narrativeNote,
      feedback: a.feedback,
      proposedAt: a.proposedAt.toISOString(),
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
    }));
  }

  async findLastPingForPlayer(
    sessionId: string,
    campaignId: string,
    playerId: string,
  ): Promise<PingStatusResult | null> {
    const ping = await this.prisma.sessionPing.findFirst({
      where: { sessionId, campaignId, playerId },
      orderBy: { pingedAt: 'desc' },
    });

    if (!ping) return null;

    return {
      playerId: ping.playerId,
      pingedAt: ping.pingedAt.toISOString(),
    };
  }

  async isCampaignMember(
    campaignId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.prisma.campaignMember.findFirst({
      where: { campaignId, userId },
    });
    return member !== null;
  }

  async findCurrentPingStatus(
    sessionId: string,
    campaignId: string,
  ): Promise<PingStatusResult | null> {
    const ping = await this.prisma.sessionPing.findFirst({
      where: { sessionId, campaignId },
      orderBy: { pingedAt: 'desc' },
    });

    if (!ping) return null;

    return {
      playerId: ping.playerId,
      pingedAt: ping.pingedAt.toISOString(),
    };
  }
}
