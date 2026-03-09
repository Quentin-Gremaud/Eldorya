import {
  Controller,
  Post,
  Param,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { ApproveCharacterModificationCommand } from '../../../character/character/commands/approve-character-modification.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class ApproveCharacterModificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/approve-modification')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new ApproveCharacterModificationCommand(characterId, campaignId, userId),
    );
  }
}
