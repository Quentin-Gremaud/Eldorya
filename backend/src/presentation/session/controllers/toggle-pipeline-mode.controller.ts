import {
  Controller,
  Put,
  Param,
  Body,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { TogglePipelineModeCommand } from '../../../session/session/commands/toggle-pipeline-mode.command.js';
import { TogglePipelineModeDto } from '../dto/toggle-pipeline-mode.dto.js';
import { CampaignDetailFinder } from '../../campaign/finders/campaign-detail.finder.js';

@Controller('campaigns')
export class TogglePipelineModeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignDetailFinder: CampaignDetailFinder,
  ) {}

  @Put(':campaignId/sessions/:sessionId/pipeline-mode')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: TogglePipelineModeDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const campaign = await this.campaignDetailFinder.findById(campaignId);
    if (!campaign) throw new NotFoundException();
    if (campaign.gmUserId !== userId) throw new ForbiddenException();

    await this.commandBus.execute(
      new TogglePipelineModeCommand(sessionId, campaignId, userId, dto.pipelineMode),
    );
  }
}
