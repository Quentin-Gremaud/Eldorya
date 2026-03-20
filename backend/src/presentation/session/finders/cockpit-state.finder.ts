import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface CockpitPlayerResult {
  userId: string;
  role: string;
  characterId: string | null;
  characterName: string | null;
  characterStatus: string | null;
}

export interface CockpitStateResult {
  sessionId: string;
  campaignId: string;
  gmUserId: string;
  mode: string;
  pipelineMode: string;
  pendingActionsCount: number;
  players: CockpitPlayerResult[];
}

@Injectable()
export class CockpitStateFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findCockpitState(
    sessionId: string,
    campaignId: string,
  ): Promise<CockpitStateResult | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.campaignId !== campaignId || session.status !== 'active') {
      return null;
    }

    const [pendingActionsCount, members, characters] = await Promise.all([
      this.prisma.sessionAction.count({
        where: { sessionId, campaignId, status: 'pending' },
      }),
      this.prisma.campaignMember.findMany({
        where: { campaignId },
      }),
      this.prisma.character.findMany({
        where: { campaignId },
        select: {
          id: true,
          userId: true,
          name: true,
          status: true,
        },
      }),
    ]);

    const characterMap = new Map(
      characters.map((c) => [c.userId, c]),
    );

    const players: CockpitPlayerResult[] = members
      .filter((m) => m.userId !== session.gmUserId)
      .map((m) => {
        const char = characterMap.get(m.userId);
        return {
          userId: m.userId,
          role: m.role,
          characterId: char?.id ?? null,
          characterName: char?.name ?? null,
          characterStatus: char?.status ?? null,
        };
      });

    return {
      sessionId: session.id,
      campaignId: session.campaignId,
      gmUserId: session.gmUserId,
      mode: session.mode,
      pipelineMode: session.pipelineMode,
      pendingActionsCount,
      players,
    };
  }
}
