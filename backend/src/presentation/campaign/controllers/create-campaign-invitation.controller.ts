import {
  Controller,
  Post,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { randomUUID, randomBytes } from 'crypto';
import { AuthUserId } from '../../../infrastructure/auth/auth-user-id.decorator.js';
import { CreateInvitationDto } from '../dto/create-invitation.dto.js';
import { CreateInvitationCommand } from '../../../campaign/invitation/commands/create-invitation.command.js';
import { InvitationToken } from '../../../campaign/invitation/invitation-token.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Controller('campaigns')
export class CreateCampaignInvitationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':campaignId/invitations')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async handle(
    @Param('campaignId', new ParseUUIDPipe()) campaignId: string,
    @Body() dto: CreateInvitationDto,
    @AuthUserId() userId: string,
  ): Promise<{
    data: { token: string; inviteUrl: string; expiresAt: string };
  }> {
    // C3: Verify campaign exists and user is the GM
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { gmUserId: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    if (campaign.gmUserId !== userId) {
      throw new ForbiddenException(
        'Only the Game Master can create invitation links.',
      );
    }

    const invitationId = randomUUID();
    const rawToken = randomBytes(32).toString('base64url');
    // H10: Hash token in controller, never pass raw token through command bus
    const tokenHash = InvitationToken.fromRawToken(rawToken).hash();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + dto.expiresInDays);

    await this.commandBus.execute(
      new CreateInvitationCommand(
        invitationId,
        tokenHash,
        campaignId,
        userId,
        expiresAt,
      ),
    );

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    return {
      data: {
        token: rawToken,
        inviteUrl: `${frontendUrl}/invite/${rawToken}`,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }
}
