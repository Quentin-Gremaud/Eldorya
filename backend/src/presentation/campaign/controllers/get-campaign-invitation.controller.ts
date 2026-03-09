import {
  Controller,
  Get,
  Param,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { InvitationFinder } from '../finders/invitation.finder.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Controller('campaigns')
export class GetCampaignInvitationController {
  constructor(
    private readonly invitationFinder: InvitationFinder,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':campaignId/invitation')
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @AuthUserId() userId: string,
  ): Promise<{
    data: {
      id: string;
      campaignId: string;
      createdAt: string;
      expiresAt: string | null;
      status: string;
    } | null;
  }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { gmUserId: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    if (campaign.gmUserId !== userId) {
      throw new ForbiddenException(
        'Only the Game Master can view invitation details.',
      );
    }

    const invitation =
      await this.invitationFinder.findActiveByCampaignId(campaignId);

    if (!invitation) {
      return { data: null };
    }

    return {
      data: {
        id: invitation.id,
        campaignId: invitation.campaignId,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt
          ? invitation.expiresAt.toISOString()
          : null,
        status: invitation.status,
      },
    };
  }
}
