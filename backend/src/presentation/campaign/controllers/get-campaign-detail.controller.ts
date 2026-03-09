import {
  Controller,
  Get,
  Param,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CampaignDetailFinder } from '../finders/campaign-detail.finder.js';

@Controller('campaigns')
export class GetCampaignDetailController {
  constructor(private readonly finder: CampaignDetailFinder) {}

  @Get(':id')
  async handle(
    @Param('id', new ParseUUIDPipe()) id: string,
    @AuthUserId() userId: string,
  ): Promise<{
    data: {
      id: string;
      name: string;
      description: string | null;
      coverImageUrl: string | null;
      status: string;
      gmDisplayName: string;
      playerCount: number;
      lastSessionDate: string | null;
      userRole: 'gm' | 'player';
      createdAt: string;
    };
  }> {
    const result = await this.finder.findCampaignDetail(id, userId);

    if (!result) {
      throw new NotFoundException('Campaign not found.');
    }

    const isGm = result.campaign.gmUserId === userId;

    if (!isGm && !result.membership) {
      throw new ForbiddenException(
        'You do not have access to this campaign.',
      );
    }

    const userRole: 'gm' | 'player' = isGm ? 'gm' : 'player';

    return {
      data: {
        id: result.campaign.id,
        name: result.campaign.name,
        description: result.campaign.description,
        coverImageUrl: result.campaign.coverImageUrl,
        status: result.campaign.status,
        gmDisplayName: result.gmDisplayName,
        playerCount: result.campaign.playerCount,
        lastSessionDate: result.campaign.lastSessionDate?.toISOString() ?? null,
        userRole,
        createdAt: result.campaign.createdAt.toISOString(),
      },
    };
  }
}
