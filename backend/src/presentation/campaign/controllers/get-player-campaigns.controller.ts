import { Controller, Get } from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { PlayerCampaignsFinder } from '../finders/player-campaigns.finder.js';
import { PlayerCampaignDto } from '../dto/player-campaign.dto.js';

@Controller('campaigns')
export class GetPlayerCampaignsController {
  constructor(private readonly finder: PlayerCampaignsFinder) {}

  @Get('player')
  async handle(
    @AuthUserId() userId: string,
  ): Promise<{ data: PlayerCampaignDto[] }> {
    const campaigns = await this.finder.findPlayerCampaigns(userId);
    return { data: campaigns };
  }
}
