import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { FogStateFinder, type FogZoneResult } from '../finders/fog-state.finder.js';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';

@Controller('campaigns')
export class GetPlayerFogStateController {
  constructor(private readonly fogStateFinder: FogStateFinder) {}

  @Get(':campaignId/maps/:mapLevelId/fog')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('mapLevelId', new ParseUUIDPipe()) mapLevelId: string,
    @Query('playerId', new ParseUUIDPipe()) playerId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: FogZoneResult[] }> {
    await this.fogStateFinder.checkPlayerOrGmAccess(campaignId, playerId, userId);
    const data = await this.fogStateFinder.findRevealedZones(
      campaignId,
      mapLevelId,
      playerId,
    );
    return { data };
  }
}
