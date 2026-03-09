import {
  Controller,
  Patch,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { ModifyCharacterByGmCommand } from '../../../character/character/commands/modify-character-by-gm.command.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';
import { ModifyCharacterByGmDto } from '../dto/modify-character-by-gm.dto.js';

@Controller('campaigns')
export class ModifyCharacterByGmController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Patch(':campaignId/characters/:characterId')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @AuthUserId() userId: string,
    @Body() dto: ModifyCharacterByGmDto,
  ): Promise<void> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(
      campaignId,
      userId,
    );

    await this.commandBus.execute(
      new ModifyCharacterByGmCommand(characterId, userId, {
        name: dto.name,
        race: dto.race,
        characterClass: dto.characterClass,
        background: dto.background,
        stats: dto.stats,
        spells: dto.spells,
      }),
    );
  }
}
