import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { TokenFinder, type TokenResult } from '../finders/token.finder.js';
import { MapLevelFinder } from '../../map/finders/map-level.finder.js';

@Controller('campaigns')
export class GetTokensController {
  constructor(
    private readonly tokenFinder: TokenFinder,
    private readonly mapLevelFinder: MapLevelFinder,
  ) {}

  @Get(':campaignId/tokens')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Query('mapLevelId', new ParseUUIDPipe()) mapLevelId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: TokenResult[] }> {
    await this.mapLevelFinder.checkCampaignAccess(campaignId, userId);

    const data = await this.tokenFinder.findByCampaignAndMapLevel(
      campaignId,
      mapLevelId,
    );
    return { data };
  }
}
