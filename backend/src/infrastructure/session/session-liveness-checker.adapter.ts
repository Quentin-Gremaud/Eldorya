import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { SessionLivenessChecker, LiveSessionInfo } from '../../session/action-pipeline/session-liveness-checker.port.js';

@Injectable()
export class PrismaSessionLivenessChecker implements SessionLivenessChecker {
  constructor(private readonly prisma: PrismaService) {}

  async getLiveSession(sessionId: string, campaignId: string): Promise<LiveSessionInfo | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) return null;
    if (session.campaignId !== campaignId) return null;
    if (session.mode !== 'live') return null;
    return {
      sessionId: session.id,
      campaignId: session.campaignId,
      gmUserId: session.gmUserId,
    };
  }
}
