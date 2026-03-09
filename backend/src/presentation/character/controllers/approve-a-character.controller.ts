import {
  Controller,
  Post,
  Param,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { ApproveACharacterCommand } from '../../../character/character/commands/approve-a-character.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class ApproveACharacterController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/approve')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new ApproveACharacterCommand(characterId, userId),
    );
  }
}
