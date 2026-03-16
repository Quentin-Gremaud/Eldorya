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
import { ChangeSessionModeCommand } from '../../../session/session/commands/change-session-mode.command.js';
import { ChangeSessionModeDto } from '../dto/change-session-mode.dto.js';
import { CampaignDetailFinder } from '../../campaign/finders/campaign-detail.finder.js';

@Controller('campaigns')
export class ChangeASessionModeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignDetailFinder: CampaignDetailFinder,
  ) {}

  @Put(':campaignId/sessions/:sessionId/mode')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: ChangeSessionModeDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const campaign = await this.campaignDetailFinder.findById(campaignId);
    if (!campaign) throw new NotFoundException();
    if (campaign.gmUserId !== userId) throw new ForbiddenException();

    await this.commandBus.execute(
      new ChangeSessionModeCommand(sessionId, campaignId, userId, dto.mode),
    );
  }
}
