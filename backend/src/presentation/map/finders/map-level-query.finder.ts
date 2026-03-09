import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

export interface MapLevelResult {
  id: string;
  campaignId: string;
  name: string;
  parentId: string | null;
  depth: number;
  backgroundImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MapLevelQueryFinder {
  constructor(private readonly prisma: PrismaService) {}

  async findByCampaignId(campaignId: string): Promise<MapLevelResult[]> {
    return this.prisma.mapLevel.findMany({
      where: { campaignId },
      orderBy: [{ depth: 'asc' }, { name: 'asc' }],
    });
  }
}
