import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RejectCharacterModificationCommand } from '../../../character/character/commands/reject-character-modification.command.js';
import { RejectCharacterModificationDto } from '../dto/reject-character-modification.dto.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class RejectCharacterModificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Post(':campaignId/characters/:characterId/reject-modification')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @Body() dto: RejectCharacterModificationDto,
    @AuthUserId() userId: string,
  ): Promise<void> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(campaignId, userId);

    await this.commandBus.execute(
      new RejectCharacterModificationCommand(
        characterId,
        campaignId,
        userId,
        dto.reason,
      ),
    );
  }
}
