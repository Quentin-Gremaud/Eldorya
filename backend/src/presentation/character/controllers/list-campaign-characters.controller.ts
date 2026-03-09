import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import {
  CampaignCharactersFinder,
  type CharacterSummary,
} from '../finders/campaign-characters.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class ListCampaignCharactersController {
  constructor(
    private readonly campaignCharactersFinder: CampaignCharactersFinder,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Get(':campaignId/characters')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: CharacterSummary[] }> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(
      campaignId,
      userId,
    );

    const data =
      await this.campaignCharactersFinder.findApprovedByCampaignId(campaignId);
    return { data };
  }
}
