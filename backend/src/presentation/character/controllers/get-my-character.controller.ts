import {
  Controller,
  Get,
  Param,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CharacterDetailFinder } from '../finders/character-detail.finder.js';
import { CampaignAnnouncementsFinder } from '../../campaign/finders/campaign-announcements.finder.js';

@Controller('campaigns')
export class GetMyCharacterController {
  constructor(
    private readonly characterDetailFinder: CharacterDetailFinder,
    private readonly campaignAnnouncementsFinder: CampaignAnnouncementsFinder,
  ) {}

  @Get(':campaignId/characters/me')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{
    data: {
      id: string;
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
      rejectionReason: string | null;
      createdAt: string;
    };
  }> {
    const check =
      await this.campaignAnnouncementsFinder.checkCampaignMembership(
        campaignId,
        userId,
      );
    if (!check.exists) throw new NotFoundException();
    if (!check.isMember) throw new ForbiddenException();

    const character = await this.characterDetailFinder.findByUserAndCampaign(
      userId,
      campaignId,
    );

    if (!character) {
      throw new NotFoundException('No character found for this player in this campaign.');
    }

    return {
      data: {
        id: character.id,
        name: character.name,
        race: character.race,
        characterClass: character.characterClass,
        background: character.background,
        stats: character.stats,
        spells: character.spells,
        status: character.status,
        rejectionReason: character.rejectionReason,
        createdAt: character.createdAt.toISOString(),
      },
    };
  }
}
