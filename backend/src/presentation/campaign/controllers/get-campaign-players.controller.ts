import {
  Controller,
  Get,
  Param,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CampaignPlayersFinder } from '../finders/campaign-players.finder.js';
import {
  PlayerOnboardingItemDto,
  CampaignPlayersResponseDto,
} from '../dto/player-onboarding.dto.js';

@Controller('campaigns')
export class GetCampaignPlayersController {
  constructor(private readonly finder: CampaignPlayersFinder) {}

  @Get(':campaignId/players')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: CampaignPlayersResponseDto }> {
    const result = await this.finder.findByCampaignId(campaignId);

    if (!result.campaign) throw new NotFoundException();
    if (result.campaign.gmUserId !== userId) throw new ForbiddenException();

    const players = result.players.map(
      (p) =>
        new PlayerOnboardingItemDto({
          userId: p.userId,
          displayName: p.displayName,
          status: p.status,
          joinedAt: p.joinedAt,
        }),
    );

    const response = new CampaignPlayersResponseDto({
      players,
      hasActiveInvitation: result.hasActiveInvitation,
      allReady: result.allReady,
      playerCount: result.playerCount,
    });

    return { data: response };
  }
}
