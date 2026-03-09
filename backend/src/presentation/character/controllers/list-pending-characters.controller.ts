import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import {
  PendingCharactersFinder,
  type PendingCharacterDetail,
} from '../finders/pending-characters.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class ListPendingCharactersController {
  constructor(
    private readonly pendingCharactersFinder: PendingCharactersFinder,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Get(':campaignId/characters/pending')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: PendingCharacterDetail[] }> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(campaignId, userId);

    const data = await this.pendingCharactersFinder.findByCampaignId(
      campaignId,
    );
    return { data };
  }
}
