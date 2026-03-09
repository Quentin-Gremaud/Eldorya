import {
  Controller,
  Get,
  Param,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CampaignAnnouncementsFinder } from '../finders/campaign-announcements.finder.js';
import {
  AnnouncementItemDto,
  CampaignAnnouncementsResponseDto,
} from '../dto/campaign-announcements.dto.js';

@Controller('campaigns')
export class GetCampaignAnnouncementsController {
  constructor(private readonly finder: CampaignAnnouncementsFinder) {}

  @Get(':campaignId/announcements')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{ data: CampaignAnnouncementsResponseDto }> {
    const check = await this.finder.checkCampaignMembership(
      campaignId,
      userId,
    );
    if (!check.exists) throw new NotFoundException();
    if (!check.isMember) throw new ForbiddenException();

    const result = await this.finder.findByCampaignId(campaignId);

    const announcements = result.announcements.map(
      (a) => new AnnouncementItemDto(a),
    );

    return {
      data: new CampaignAnnouncementsResponseDto({
        announcements,
        totalCount: result.totalCount,
      }),
    };
  }
}
