import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { MapLevelQueryFinder, type MapLevelResult } from '../finders/map-level-query.finder.js';
import { MapLevelFinder } from '../finders/map-level.finder.js';

@Controller('campaigns')
export class GetMapLevelsController {
  constructor(
    private readonly mapLevelQueryFinder: MapLevelQueryFinder,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Get(':campaignId/map-levels')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: MapLevelResult[] }> {
    await this.mapLevelFinder.checkGmOwnership(campaignId, userId);

    const data = await this.mapLevelQueryFinder.findByCampaignId(campaignId);
    return { data };
  }
}
