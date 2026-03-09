import {
  Controller,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { SendAnnouncementDto } from '../dto/send-announcement.dto.js';
import { SendACampaignAnnouncementCommand } from '../../../campaign/campaign/commands/send-a-campaign-announcement.command.js';
import { CampaignDetailFinder } from '../finders/campaign-detail.finder.js';

@Controller('campaigns')
export class SendACampaignAnnouncementController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignDetailFinder: CampaignDetailFinder,
  ) {}

  @Post(':campaignId/announcements')
  @HttpCode(202)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: SendAnnouncementDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const campaign = await this.campaignDetailFinder.findById(campaignId);
    if (!campaign) throw new NotFoundException();
    if (campaign.gmUserId !== userId) throw new ForbiddenException();

    await this.commandBus.execute(
      new SendACampaignAnnouncementCommand(
        dto.id,
        campaignId,
        dto.content,
        userId,
      ),
    );
  }
}
