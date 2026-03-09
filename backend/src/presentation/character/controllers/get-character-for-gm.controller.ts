import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CharacterForGmFinder } from '../finders/character-for-gm.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class GetCharacterForGmController {
  constructor(
    private readonly characterForGmFinder: CharacterForGmFinder,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Get(':campaignId/characters/:characterId')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('characterId', new ParseUUIDPipe()) characterId: string,
    @AuthUserId() userId: string,
  ): Promise<{
    data: {
      id: string;
      userId: string;
      name: string;
      race: string;
      characterClass: string;
      background: string;
      stats: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
      };
      spells: string[];
      status: string;
      createdAt: string;
    };
  }> {
    await this.campaignAnnouncementsFinder.checkGmOwnership(
      campaignId,
      userId,
    );

    const character = await this.characterForGmFinder.findByIdAndCampaign(
      characterId,
      campaignId,
    );

    if (!character) {
      throw new NotFoundException('Character not found in this campaign.');
    }

    return {
      data: {
        id: character.id,
        userId: character.userId,
        name: character.name,
        race: character.race,
        characterClass: character.characterClass,
        background: character.background,
        stats: character.stats,
        spells: character.spells,
        status: character.status,
        createdAt: character.createdAt.toISOString(),
      },
    };
  }
}
