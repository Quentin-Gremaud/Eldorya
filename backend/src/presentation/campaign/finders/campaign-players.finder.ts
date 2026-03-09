import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { resolveGmDisplayName } from './gm-display-name.util.js';

export interface PlayerOnboardingItem {
  userId: string;
  displayName: string;
  status: 'joined' | 'ready';
  joinedAt: Date;
}

export interface CampaignPlayersResult {
  campaign: { gmUserId: string } | null;
  players: PlayerOnboardingItem[];
  hasActiveInvitation: boolean;
  allReady: boolean;
  playerCount: number;
}

@Injectable()
export class CampaignPlayersFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByCampaignId(campaignId: string): Promise<CampaignPlayersResult> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { gmUserId: true },
    });

    if (!campaign) {
      return {
        campaign: null,
        players: [],
        hasActiveInvitation: false,
        allReady: false,
        playerCount: 0,
      };
    }

    const [members, activeInvitation] = await Promise.all([
      this.prisma.campaignMember.findMany({
        where: { campaignId, role: 'player' },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.invitation.findFirst({
        where: { campaignId, status: 'active' },
        select: { id: true },
      }),
    ]);

    const hasActiveInvitation = activeInvitation !== null;

    if (members.length === 0) {
      return {
        campaign,
        players: [],
        hasActiveInvitation,
        allReady: false,
        playerCount: 0,
      };
    }

    const userIds = members.map((m) => m.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const players: PlayerOnboardingItem[] = members.map((member) => {
      const user = userMap.get(member.userId) ?? null;
      const displayName = resolveGmDisplayName(user);

      // TODO: Epic 3 — When Character model exists, check for approved character:
      // const character = await prisma.character.findFirst({
      //   where: { userId: member.userId, campaignId, status: 'approved' }
      // });
      // status = character ? 'ready' : 'joined';
      const status: 'joined' | 'ready' = 'joined'; // All players are 'joined' until Epic 3

      return {
        userId: member.userId,
        displayName,
        status,
        joinedAt: member.joinedAt,
      };
    });

    const allReady =
      players.length > 0 &&
      !hasActiveInvitation &&
      players.every((p) => p.status === 'ready');

    return {
      campaign,
      players,
      hasActiveInvitation,
      allReady,
      playerCount: players.length,
    };
  }
}
