import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import {
  PendingModificationsFinder,
  type PendingModificationDetail,
} from '../finders/pending-modifications.finder.js';

@Controller('campaigns')
export class ListPendingModificationsController {
  constructor(
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
    private readonly pendingModificationsFinder: PendingModificationsFinder,
  ) {}

  @Get(':campaignId/characters/pending-modifications')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: PendingModificationDetail[] }> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(campaignId, userId);

    const data =
      await this.pendingModificationsFinder.findByCampaignId(campaignId);
    return { data };
  }
}
