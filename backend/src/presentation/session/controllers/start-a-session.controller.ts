import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { StartSessionCommand } from '../../../session/session/commands/start-session.command.js';
import { StartSessionDto } from '../dto/start-session.dto.js';
import { CampaignDetailFinder } from '../../campaign/finders/campaign-detail.finder.js';
import { SessionFinder } from '../finders/session.finder.js';

@Controller('campaigns')
export class StartASessionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignDetailFinder: CampaignDetailFinder,
    private readonly sessionFinder: SessionFinder,
  ) {}

  @Post(':campaignId/sessions')
  @HttpCode(202)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: StartSessionDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const campaign = await this.campaignDetailFinder.findById(campaignId);
    if (!campaign) throw new NotFoundException();
    if (campaign.gmUserId !== userId) throw new ForbiddenException();

    const activeSession = await this.sessionFinder.findActiveSessionByCampaign(campaignId);
    if (activeSession) {
      throw new ConflictException('A session is already active for this campaign');
    }

    await this.commandBus.execute(
      new StartSessionCommand(dto.sessionId, campaignId, userId),
    );
  }
}
