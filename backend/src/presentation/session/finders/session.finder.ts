import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface SessionResult {
  id: string;
  campaignId: string;
  gmUserId: string;
  mode: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
}

@Injectable()
export class SessionFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveSessionByCampaign(
    campaignId: string,
  ): Promise<SessionResult | null> {
    const session = await this.prisma.session.findFirst({
      where: { campaignId, status: 'active' },
    });

    if (!session) return null;

    return {
      id: session.id,
      campaignId: session.campaignId,
      gmUserId: session.gmUserId,
      mode: session.mode,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
    };
  }

  async findById(sessionId: string): Promise<SessionResult | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) return null;

    return {
      id: session.id,
      campaignId: session.campaignId,
      gmUserId: session.gmUserId,
      mode: session.mode,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
    };
  }
}
