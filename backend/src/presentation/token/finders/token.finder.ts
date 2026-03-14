import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface TokenResult {
  id: string;
  campaignId: string;
  mapLevelId: string;
  x: number;
  y: number;
  tokenType: string;
  label: string;
  destinationMapLevelId: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TokenFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByCampaignAndMapLevel(
    campaignId: string,
    mapLevelId: string,
  ): Promise<TokenResult[]> {
    const tokens = await this.prisma.token.findMany({
      where: { campaignId, mapLevelId },
      orderBy: { createdAt: 'asc' },
    });

    return tokens.map((t) => ({
      id: t.id,
      campaignId: t.campaignId,
      mapLevelId: t.mapLevelId,
      x: t.x,
      y: t.y,
      tokenType: t.tokenType,
      label: t.label,
      destinationMapLevelId: t.destinationMapLevelId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
  }
}
