import {
  Controller,
  Post,
  Param,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { ReactivateACampaignCommand } from '../../../campaign/campaign/commands/reactivate-a-campaign.command.js';
import { CampaignDetailFinder } from '../finders/campaign-detail.finder.js';

@Controller('campaigns')
export class ReactivateACampaignController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignDetailFinder: CampaignDetailFinder,
  ) {}

  @Post(':campaignId/reactivate')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const campaign = await this.campaignDetailFinder.findById(campaignId);
    if (!campaign) throw new NotFoundException();
    if (campaign.gmUserId !== userId) throw new ForbiddenException();

    await this.commandBus.execute(
      new ReactivateACampaignCommand(campaignId, userId),
    );
  }
}
