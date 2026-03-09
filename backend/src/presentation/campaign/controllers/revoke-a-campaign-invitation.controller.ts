import {
  Controller,
  Delete,
  Param,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { RevokeAnInvitationCommand } from '../../../campaign/invitation/commands/revoke-an-invitation.command.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Controller('campaigns')
export class RevokeACampaignInvitationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @Delete(':campaignId/invitations/:invitationId')
  @HttpCode(202)
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Param('invitationId', new ParseUUIDPipe()) invitationId: string,
    @AuthUserId() userId: string,
  ): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { gmUserId: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    if (campaign.gmUserId !== userId) {
      throw new ForbiddenException(
        'Only the Game Master can revoke invitation links.',
      );
    }

    await this.commandBus.execute(
      new RevokeAnInvitationCommand(invitationId, campaignId, userId),
    );
  }
}
